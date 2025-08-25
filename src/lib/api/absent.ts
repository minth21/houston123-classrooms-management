import api from "./axios";
import { companyService } from "./company";

// --- Type Definitions (Không thay đổi) ---
export interface AttendanceStudent {
  userId: string;
  userName: string;
  absent: boolean | string;
  school?: string;
}

export interface AttendanceSession {
  classId: string;
  date: string;
  student: AttendanceStudent[];
  staffName?: string;
  subjectName?: string;
  branch: string;
}

export interface AbsentEvent {
  userId: string;
  userName: string;
  school?: string;
  classId: string;
  teacherName?: string;
  startDate: string;
  endDate: string;
  isConsecutive: boolean;
}

// --- Helper Function (Không thay đổi) ---
function isConsecutiveDays(dateStr1: string, dateStr2: string): boolean {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// --- Absent Service ---
export const absentService = {
  async getAbsenteeReportByBranch(): Promise<AbsentEvent[]> {
    const branchId = companyService.getSelectedBranch();
    if (!branchId) return [];

    try {
      // 1. Lấy tất cả dữ liệu điểm danh (Không thay đổi)
      const response = await api.get('/classroom/attendance', { params: { branch: branchId } });
      const sessionsForBranch: AttendanceSession[] = response.data.data || response.data || [];

      // 2. Gom nhóm tất cả các lần vắng mặt theo từng học sinh (Không thay đổi)
      const absencesByStudent = new Map<string, { date: string; classId: string; teacherName?: string; school?: string; userName: string }[]>();
      for (const session of sessionsForBranch) {
        if (session.student && Array.isArray(session.student)) {
          for (const stud of session.student) {
            if (stud.absent === true || stud.absent === 'true') {
              if (!absencesByStudent.has(stud.userId)) {
                absencesByStudent.set(stud.userId, []);
              }
              absencesByStudent.get(stud.userId)!.push({
                date: session.date,
                classId: session.classId,
                teacherName: session.staffName,
                school: stud.school,
                userName: stud.userName,
              });
            }
          }
        }
      }

      // 3. Xử lý logic gộp các ngày liên tiếp (Không thay đổi)
      const finalReport: AbsentEvent[] = [];
      absencesByStudent.forEach((absences, userId) => {
        if (absences.length === 0) return;
        const userName = absences[0].userName;
        const sortedAbsences = absences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let streakStartInfo = sortedAbsences[0];
        for (let i = 1; i < sortedAbsences.length; i++) {
          if (!isConsecutiveDays(sortedAbsences[i - 1].date, sortedAbsences[i].date)) {
            const streakEndInfo = sortedAbsences[i - 1];
            finalReport.push({
              userId,
              userName,
              school: streakStartInfo.school,
              classId: streakStartInfo.classId,
              teacherName: streakStartInfo.teacherName,
              startDate: streakStartInfo.date,
              endDate: streakEndInfo.date,
              isConsecutive: streakStartInfo.date !== streakEndInfo.date,
            });
            streakStartInfo = sortedAbsences[i];
          }
        }
        const lastStreakEndInfo = sortedAbsences[sortedAbsences.length - 1];
        finalReport.push({
          userId,
          userName,
          school: streakStartInfo.school,
          classId: streakStartInfo.classId,
          teacherName: streakStartInfo.teacherName,
          startDate: streakStartInfo.date,
          endDate: lastStreakEndInfo.date,
          isConsecutive: streakStartInfo.date !== lastStreakEndInfo.date,
        });
      });

      // THAY ĐỔI DUY NHẤT: Thêm bộ lọc tại đây
      const consecutiveOnly = finalReport.filter(event => event.isConsecutive);

      // Sắp xếp và trả về danh sách đã được lọc
      return consecutiveOnly.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
    } catch (error) {
      console.error(`Lỗi khi tải điểm danh cho chi nhánh ${branchId}:`, error);
      return [];
    }
  },
};