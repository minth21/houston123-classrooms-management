// services/student.ts
import api from "./axios";
import { classroomService, Classroom } from "./classroom";

export interface Student {
  _id: string;
  userId: string;
  userName: string;
  classId?: string;
  school?: string;
  phoneNumber?: string;
  subjectName?: string;
  teacherName?: string;
  teacherId?: string;
  grade?: string;
  absent?: boolean;
}

interface ClassroomDataPayload {
  classrooms: Classroom[];
  memberResponses: any[];
}

export const studentService = {
  async _fetchClassroomData(): Promise<ClassroomDataPayload> {
    const classrooms: Classroom[] = await classroomService.getClassrooms();
    if (!classrooms.length)
      return { classrooms: [], memberResponses: [] };

    const memberPromises = classrooms.map((cls) =>
      api
        .get(`/classroom/${cls.classID}/member?isOriginal=true`)
        .catch(() => ({ data: { data: [] } }))
    );
    
    const memberResponses = await Promise.all(memberPromises);
    return { classrooms, memberResponses };
  },

  async getStudentsByBranch(): Promise<Student[]> {
    const { classrooms, memberResponses } = await this._fetchClassroomData();
    if (!classrooms.length) return [];

    const studentMap = new Map<string, Student>();

    memberResponses.forEach((res, index) => {
      (res?.data?.data || res?.data || []).forEach((studentData: any) => {
        if (studentData.userID && !studentMap.has(studentData.userID)) {
          studentMap.set(studentData.userID, {
            _id: studentData.id?.toString() || studentData.userID,
            userId: studentData.userID,
            userName: studentData.name,
            classId: studentData.classID,
            school: studentData.schoolName,
            phoneNumber: studentData.phoneNumber,
            subjectName: classrooms[index].subjectName,
            teacherName: classrooms[index].teacherName,
            teacherId: classrooms[index].teacherCode,
            grade: classrooms[index].grade,
          });
        }
      });
    });

    return Array.from(studentMap.values()).sort((a, b) =>
      a.userName.localeCompare(b.userName)
    );
  },
};