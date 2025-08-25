
import api from "./axios";
import { classroomService, Classroom } from "./classroom";


export interface LowScoreEntry {
    classId: string;
    date: string;
    scoreDisplay: string; 
    comment: string;
}

export interface GroupedLowScoreStudent {
    studentId: string;
    studentName: string;
    grade: string;
    scores: LowScoreEntry[]; 
}

export const lowScoreByBranchService = {
    /**
     * Lấy tất cả các trường hợp điểm thấp trong một chi nhánh VÀO MỘT THÁNG CỤ THỂ.
     */
    async getLowScoresByBranch(month: number, year: number): Promise<GroupedLowScoreStudent[]> {
        
        try {
            const classrooms = await classroomService.getClassrooms();
            if (!classrooms.length) return [];

            const scoreSheetPromises = classrooms.map(classroom =>
                api.get('/classroom/scoreSheet', { 
                    params: { 
                        classID: classroom.classID,
                        month: month,
                        year: year 
                    } 
                })
                   .catch(error => {
                        console.error(`Lỗi tải bảng điểm cho lớp ${classroom.classID}:`, error.message);
                        return null;
                    })
            );
            const scoreSheetResponses = await Promise.all(scoreSheetPromises);
            
            const studentMap = new Map<string, GroupedLowScoreStudent>();
            const yyyymm = `${year}${month.toString().padStart(2, '0')}`;

            scoreSheetResponses.forEach((response, index) => {
                if (!response) return;
                const classroom = classrooms[index];
                const scoreSheetData = response.data?.data || response.data || {};

                for (const userId in scoreSheetData) {
                    const studentData = scoreSheetData[userId];
                    
                    const scoreDetail = studentData.score?.[yyyymm]?.[classroom.classID];
                    if (!scoreDetail?.score?.trueScore) continue;
                    
                    const lowSkills: string[] = [];
                    for (const skillScore of scoreDetail.score.trueScore) {
                        const numericScore = parseFloat(skillScore._d);
                        if (!isNaN(numericScore) && numericScore < 7 && skillScore.d === 'C') {
                            // Kiểm tra nếu tên kỹ năng (l) tồn tại thì mới hiển thị
                            const skillNameDisplay = skillScore.l ? `${skillScore.l}: ` : '';
        const displayString = `${skillNameDisplay}${numericScore} (${skillScore.d})`;
                            lowSkills.push(displayString);
                        }
                    }

                    if (lowSkills.length > 0) {
                        const newScoreEntry: LowScoreEntry = {
                            classId: classroom.classID,
                            date: `Tháng ${scoreDetail.month}/${scoreDetail.year}`,
                            scoreDisplay: lowSkills.join('\n'),
                            comment: scoreDetail.comment || scoreDetail.score.comment || "N/A",
                        };

                        if (!studentMap.has(userId)) {
                            studentMap.set(userId, {
                                studentId: studentData.userID,
                                studentName: studentData.userName,
                                grade: studentData.grade,
                                scores: [],
                            });
                        }
                        studentMap.get(userId)!.scores.push(newScoreEntry);
                    }
                }
            });
            
            const finalResults = Array.from(studentMap.values());
            return finalResults.sort((a, b) => a.studentName.localeCompare(b.studentName));

        } catch (error) {
            console.error("Lỗi khi quét điểm thấp theo chi nhánh:", error);
            return [];
        }
    }
};