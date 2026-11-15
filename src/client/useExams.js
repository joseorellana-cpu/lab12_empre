// PART 3 - the hook of the exams screen: the list with its three states, delete and create.
// Returns { status, exams, error, actionError, saving, reload, remove, create }.
// Rule of the course: no hook inside an if, a loop or after a return.
import { useCallback, useEffect, useRef, useState } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

const LOADING = { status: "loading", exams: [], error: null };

export default function useExams() {
  const [list, setList] = useState(LOADING);
  const [attempt, setAttempt] = useState(0);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);

  // The list request, with its three states. Each run of the effect owns an AbortController and a `cancelled`
  // flag; the cleanup (on reload and on unmount) raises the flag and aborts the request, so a late answer can never
  // overwrite a newer one, and nothing touches the state after unmounting.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setList(LOADING);
    listExams({ signal: controller.signal }).then(
      (exams) => {
        if (!cancelled) setList({ status: "ready", exams, error: null });
      },
      (error) => {
        if (!cancelled) setList({ status: "error", exams: [], error: describeError(error) });
      }
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Team decision: after the server CONFIRMS a delete or a create, the list is updated locally (filter / append)
  // instead of asking for it again. One request less, no flash of the loading state, and the change is only shown
  // once the server said yes (never before). If the server fails, the list stays as it was and actionError says why.
  const remove = useCallback(async (id) => {
    setActionError(null);
    try {
      await deleteExam(id);
      setList((current) => ({ ...current, exams: current.exams.filter((exam) => exam.id !== id) }));
      return true;
    } catch (error) {
      setActionError(describeError(error));
      return false;
    }
  }, []);

  // The double-submit guard is a ref: it changes at once, inside the same click. A state would only change on the
  // next render, so two calls in a row would both see `saving === false` and send two POSTs.
  const inFlight = useRef(false);
  const create = useCallback(async (title) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSaving(true);
    setActionError(null);
    try {
      const exam = await createExam(title);
      setList((current) => ({ ...current, exams: [...current.exams, exam] }));
      return true;
    } catch (error) {
      setActionError(describeError(error));
      return false;
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, []);

  return { ...list, actionError, saving, reload, remove, create };
}
