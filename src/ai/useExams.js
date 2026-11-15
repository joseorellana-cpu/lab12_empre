import { useCallback, useEffect, useRef, useState } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false); // Fix 4: double-submit guard (a ref changes at once; a state would be too late)

  useEffect(() => {
    // Fix 3: cleanup. The effect aborts its request and ignores a late answer (reload, StrictMode, unmount).
    const controller = new AbortController();
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listExams({ signal: controller.signal })
      .then((data) => {
        if (cancelled) return;
        setExams(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        // Fix 2: the error reaches the screen (status "error" + a sentence), not only the console.
        setExams([]);
        setError(describeError(err));
        setStatus("error");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const remove = useCallback(async (id) => {
    try {
      await deleteExam(id);
    } catch (err) {
      setActionError(describeError(err));
      return false;
    }
  }, []);

  const create = useCallback(async (title) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSaving(true);
    setActionError(null);
    try {
      const exam = await createExam(title);
      setExams((current) => [...current, exam]);
      return true;
    } catch (err) {
      setActionError(describeError(err));
      return false;
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, []);

  return { status, exams, error, actionError, saving, reload, remove, create };
}
