import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/student.service';
import { successResponse } from '../utils/response';
import type { CreateStudentInput, UpdateStudentInput } from '../validators/student.validator';

export const studentController = {
  /**
   * GET /api/v1/students
   * List all students.
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await studentService.getStudents();
      res.status(200).json(successResponse(students));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/students/search?q=...
   * Search students. Must come BEFORE /:id.
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q =
        (req.query.q as string) ||
        ((res.locals as Record<string, unknown>).query as { q?: string })?.q ||
        '';
      const students = await studentService.searchStudents(q);
      res.status(200).json(successResponse(students));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/students/:id
   * Get a single student.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentService.getStudentById(String(req.params.id));
      res.status(200).json(successResponse(student));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/students
   * Create a new student. Optionally enrolls them in a class+session in
   * the same call. Proprietor only.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateStudentInput;
      const student = await studentService.createStudent(input);
      res.status(201).json(successResponse(student, 'Student registered successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/students/:id
   * Update a student. Proprietor only.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateStudentInput;
      const student = await studentService.updateStudent(String(req.params.id), input);
      res.status(200).json(successResponse(student, 'Student updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/students/:id
   * Soft-delete a student. Withdraws all active enrollments. If the
   * student has no historical enrollments or results, the row is removed.
   * Proprietor only.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await studentService.deleteStudent(String(req.params.id));
      res.status(200).json(successResponse(null, 'Student removed'));
    } catch (error) {
      next(error);
    }
  },
};
