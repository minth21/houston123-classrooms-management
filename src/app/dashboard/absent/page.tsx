'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { companyService } from "@/lib/api/company";
import { absentService, AbsentEvent } from "@/lib/api/absent";

import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loader from "@/components/loader";

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');

export default function AbsenteeReportPage() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [absentEvents, setAbsentEvents] = useState<AbsentEvent[]>([]);
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    if (!companyService.getSelectedBranch()) {
      setLoading(false);
      setAbsentEvents([]);
      return;
    }
    setLoading(true);
    try {
      const data = await absentService.getAbsenteeReportByBranch();
      setAbsentEvents(data);
    } catch (error) {
      console.error("Lỗi khi tải báo cáo vắng:", error);
      setAbsentEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchData();
    window.addEventListener("branchChanged", fetchData);
    return () => {
      window.removeEventListener("branchChanged", fetchData);
    };
  }, [fetchData]);

  if (!isClient) return null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={t('absenteeReport.header.title')}
        description={t('absenteeReport.header.description')}
      />
      <Card>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ textAlign: 'center' }}>{t('absenteeReport.table.studentName')}</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>{t('absenteeReport.table.class')}</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>{t('absenteeReport.table.absentDate')}</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>{t('absenteeReport.table.teacher')}</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>{t('absenteeReport.table.note')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24" style={{ textAlign: 'center' }}>
                      <Loader /> <span className="ml-2">{t('absenteeReport.loading')}...</span>
                    </TableCell>
                  </TableRow>
                ) : absentEvents.length > 0 ? (
                  absentEvents.map((event, index) => (
                    <TableRow key={`${event.userId}-${event.startDate}-${index}`}>
                      <TableCell className="font-medium" style={{ textAlign: 'center' }}>{event.userName}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>{event.classId}</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        {event.isConsecutive
                          ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                          : formatDate(event.startDate)
                        }
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>{event.teacherName || '—'}</TableCell>
                      <TableCell className="font-bold text-red-500" style={{ textAlign: 'center' }}>
                        {event.isConsecutive ? 'X' : ''}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24" style={{ textAlign: 'center' }}>
                      {t('absenteeReport.noData')}
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
}