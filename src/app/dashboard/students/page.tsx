'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { studentService, Student } from "@/lib/api/student";
import { companyService } from "@/lib/api/company";
import { useTranslation } from "react-i18next";
import DashboardHeader from "@/components/dashboard-header";
import Loader from "@/components/loader";

// Import các component từ shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Cập nhật interface Column để thêm className cho responsive
interface Column<T> {
  key: keyof T | string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string; // Thêm className để điều khiển hiển thị
}

const StudentList: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { t } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cấu hình các cột và className responsive
  const studentColumns = useMemo((): Column<Student>[] => [
    { 
      key: 'userName', 
      header: t('studentsPage.tableHeaders.name'), 
      render: (item) => item.userName,
    },
    { 
      key: 'classId', 
      header: t('studentsPage.tableHeaders.classId'), 
      render: (item) => item.classId || "—",
    },
    { 
      key: 'teacherName', 
      header: t('studentsPage.tableHeaders.teacherName'), 
      render: (item) => item.teacherName || "—",
      // Ẩn cột này trên màn hình nhỏ hơn medium (md)
      className: "hidden md:table-cell",
    },
    { 
      key: 'subjectName', 
      header: t('studentsPage.tableHeaders.subject'), 
      render: (item) => item.subjectName || "—",
      // Ẩn cột này trên màn hình nhỏ hơn large (lg)
      className: "hidden lg:table-cell",
    },
    { 
      key: 'school', 
      header: t('studentsPage.tableHeaders.school'), 
      render: (item) => item.school || "—",
      className: "hidden lg:table-cell",
    },
    { 
      key: 'phoneNumber', 
      header: t('studentsPage.tableHeaders.phone'), 
      render: (item) => item.phoneNumber || "—",
      className: "hidden md:table-cell",
    },
  ], [t]);

  const fetchData = useCallback(async (branch: string | null) => {

    if (!branch) {

      setStudents([]);

      setLoading(false);

      return;

    }

    setLoading(true);

    try {

      const allStudents = await studentService.getStudentsByBranch();

      const filteredStudents = allStudents.filter(s => s.classId?.startsWith(branch));

      setStudents(filteredStudents);

    } catch (error) {

      console.error("Lỗi khi tải dữ liệu học sinh:", error);

      setStudents([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {
    const handleBranchChange = () => {
      const selectedBranch = companyService.getSelectedBranch();
      fetchData(selectedBranch);
    };

    handleBranchChange();
    window.addEventListener("branchChanged", handleBranchChange);

    return () => window.removeEventListener("branchChanged", handleBranchChange);
  }, [fetchData]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t("studentsPage.header.title")}
        description={t("studentsPage.header.description")}
      />
      <Card>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {studentColumns.map((col) => (
                    <TableHead key={col.key as string} className={col.className}>
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={studentColumns.length} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader />
                        <span className="ml-2">{t("studentsPage.loading")}...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student.userId}>
                      {studentColumns.map((col) => (
                        <TableCell key={col.key as string} className={col.className}>
                          {col.render(student)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={studentColumns.length} className="h-24 text-center">
                      {t("studentsPage.noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentList;