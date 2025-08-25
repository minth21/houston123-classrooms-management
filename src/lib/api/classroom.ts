// services/classroom.ts
import api from "./axios";
import { companyService } from "./company";

export interface RecordingSettings {
  resolution: string;
  bitrate: number; 
  fps: number;
  codec: string; 
  audioQuality: {
    bitrate: number;
    sampleRate: number; 
    channels: number;
  };
}

export interface Classroom {
  _id: string;
  classID: string;
  teacherCode: string;
  subjectCode: string;
  grade: string;
  branch: string;
  startDate: string;
  finishDate: string;
  supporter: string[];
  publicMember: string[];
  partnerSchoolId: string | null;
  schoolShift: any[];
  member: any[];
  __v: number;
  moodleCourseId: number | null;
  detail?: {
    lastSync?: string;
    className?: string;
    teacherName?: string;
  };
  program?: {
    [key: string]: string;
  };
  status: number;
  conversationMonthlyUpdated: any[];
  diaryMonthlyUpdated: any[];
  ID: number;
  subjectName: string;
  teacherName: string;
  role: string;
  beginDate: string;
  reason: string | null;
  endClassStaffCode: string | null;
  studentNumber: number | null;
  schedule: Array<{
    classRoomCode?: string;
    dayOfWeek?: number;
    beginTime?: string;
    finishTime?: string;
  }>;
  isActive: boolean;
  salary?: {
    __v: number;
  };
  recordingSettings?: RecordingSettings; 
}

export interface Attendance {
  _id: string;
  classId: string;
  date: string;
  roomId: string;
  startTime: string;
  endTime: string;
  numberOfStudent: number;
  staffId: string;
  staffName: string;
  subjectCode: string;
  subjectName: string;
  grade: string;
  branch: string;
  startDate: string;
  finishDate: string;
  schoolShift: Array<{
    _id: string;
    roomId: string;
    day: number;
    startTime: string;
    endTime: string;
    date: string;
    expiryDate: string;
  }>;
  partnerSchoolId: string | null;
  isAttended: boolean;
  attendanceDetail: {
    confirmed: boolean;
  };
}

export interface PostComment {
  attendanceId: string;
  content: string;
  files?: File[];
}

export interface PostDiary {
  classCode: string;
  content: string;
  files?: File[];
}

/**
 * Cấu trúc dữ liệu đơn giản cho một item trong bộ lọc lớp học.
 */
export interface ClassroomFilterItem {
  id: string;   
  name: string; 
}

export const classroomService = {
  
  /**
   * Lấy thông tin chi tiết của một lớp học dựa vào classID.
   */
  async getClassroomById(classId: string): Promise<Classroom | null> {
    if (!classId) {
      console.warn("classId không được cung cấp.");
      return null;
    }
    try {
      const response = await api.get(`/classroom/${classId}`);
      return response.data?.data || response.data || null;
    } catch (error: any) {
      console.error(`Lỗi khi lấy thông tin lớp học với ID ${classId}:`, error.message);
      return null;
    }
  },

  /**
   * Lấy danh sách các lớp học đã được định dạng sẵn cho bộ lọc (dropdown).
   */
  async getClassroomFilterData(): Promise<ClassroomFilterItem[]> {
    try {
      const classrooms = await this.getClassrooms();
      const filterData = classrooms
        .map(cls => {
          const displayName = cls.classID;
           return {
            id: cls.classID,
           name: displayName,
    };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return filterData;
    } catch (error) {
      console.error("Lỗi khi tạo dữ liệu cho bộ lọc lớp học:", error);
      return [];
    }
  },

  async getClassrooms(): Promise<Classroom[]> {
    const branchCode = companyService.getSelectedBranch();
    const companyId = companyService.getSelectedCompany();

    if (!branchCode || !companyId) {
      throw new Error("Please select a company and branch first");
    }

    try {
      const response = await api.get("/classroom", {
        params: {
          field: JSON.stringify({ partnerSchoolName: true, salary: true }),
          branch: branchCode,
        },
        headers: {
          "x-company": companyId,
        },
      });

      const classrooms = response.data?.data || response.data?.classrooms || response.data;
      return Array.isArray(classrooms) ? classrooms : [];
    } catch (error: any) {
      console.error("Error fetching classrooms:", error.message);
      throw error;
    }
  },

  async getClassroomAttendance(classCode: string): Promise<Attendance[]> {
    if (!classCode) return [];
    try {
      const response = await api.get(`/classroom/${classCode}/attendance`);
      return response.data.data || [];
    } catch (error: any) {
      console.error("Error fetching classroom attendance:", error.message);
      return [];
    }
  },

  async postComment(payload: PostComment): Promise<any> {
    const formData = new FormData();
    formData.append("content", payload.content);
    if (payload.files) {
      payload.files.forEach((file) => formData.append(`files`, file));
    }
    const response = await api.post(`/classroom/attendance/${payload.attendanceId}/comment`, formData);
    return response.data;
  },

  async postDiary(payload: PostDiary): Promise<any> {
    const formData = new FormData();
    formData.append("content", payload.content);
    if (payload.files) {
      payload.files.forEach((file) => formData.append(`files`, file));
    }
    const response = await api.post(`/classroom/${payload.classCode}/diary/post`, formData);
    return response.data;
  },
};