import { useCallback, useEffect, useState } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    listExams()
      .then((data) => {
        setExams(data);
        setStatus("ready");
      })
      .catch((err) => {
        // Fix 2: the error reaches the screen (status "error" + a sentence), not only the console.
        setExams([]);
        setError(describeError(err));
        setStatus("error");
      });
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
    try {
      const exam = await createExam(title);
      setExams((current) => [...current, exam]);
      return true;
    } catch (err) {
      setActionError(describeError(err));
      return false;
    }
  }, []);

  return { status, exams, error, actionError, saving: false, reload, remove, create };
}
