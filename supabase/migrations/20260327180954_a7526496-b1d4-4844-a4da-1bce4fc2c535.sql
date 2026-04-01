
-- Allow students to insert their own attendance
CREATE POLICY "Students can insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
