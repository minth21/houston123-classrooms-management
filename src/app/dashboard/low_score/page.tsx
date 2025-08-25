'use client'; 

import React, { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next'; // Import hook
import { lowScoreByBranchService, GroupedLowScoreStudent } from '@/lib/api/low_score';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";

export default function LowScoreByBranchPage() {
    const { t } = useTranslation(); // Khởi tạo hook
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<GroupedLowScoreStudent[]>([]);
    
    // State cho bộ lọc
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    
    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        try {
            const month = parseInt(selectedMonth, 10);
            const year = parseInt(selectedYear, 10);
            
            const data = await lowScoreByBranchService.getLowScoresByBranch(month, year);
            setResults(data);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

    return (
        <div className="space-y-6 p-4 md:p-8">
            <Card>
                <CardHeader>
                    {/* Sử dụng t() */}
                    <CardTitle>{t('lowScoreByBranch.filterCard.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-4">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            {/* Sử dụng t() */}
                            <SelectValue placeholder={t('lowScoreByBranch.filterCard.monthPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(month => (
                                <SelectItem key={month} value={month}>
                                    {/* Sử dụng t() với biến */}
                                    {t('lowScoreByBranch.filterCard.monthLabel', { month })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            {/* Sử dụng t() */}
                            <SelectValue placeholder={t('lowScoreByBranch.filterCard.yearPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch} disabled={loading}>
                        {/* Sử dụng t() */}
                        {loading ? t('lowScoreByBranch.filterCard.loadingButton') : t('lowScoreByBranch.filterCard.searchButton')}
                    </Button>
                </CardContent>
            </Card>

            {hasSearched && (
                <Card>
                    <CardHeader>
                        {/* Sử dụng t() với biến */}
                        <CardTitle>{t('lowScoreByBranch.resultsCard.title', { month: selectedMonth, year: selectedYear })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                            <Table className="table-fixed w-full">
                                <TableHeader>
                                    <TableRow>
                                         <TableHead className="text-center whitespace-nowrap w-[120px]">{t('lowScoreByBranch.resultsCard.table.headers.studentId')}</TableHead>
                                        <TableHead className="text-center whitespace-nowrap w-[200px]">{t('lowScoreByBranch.resultsCard.table.headers.studentName')}</TableHead>
                                        <TableHead className="text-center whitespace-nowrap w-[80px]">{t('lowScoreByBranch.resultsCard.table.headers.grade')}</TableHead>
                                        <TableHead className="text-center whitespace-nowrap w-[120px]">{t('lowScoreByBranch.resultsCard.table.headers.classId')}</TableHead>
                                        <TableHead className="text-center whitespace-nowrap w-[150px]">{t('lowScoreByBranch.resultsCard.table.headers.date')}</TableHead>
                                        <TableHead className="text-center w-[120px]">{t('lowScoreByBranch.resultsCard.table.headers.score')}</TableHead>
                                        <TableHead className="text-center">{t('lowScoreByBranch.resultsCard.table.headers.comment')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-48 text-center">
                                                <Loader /> {t('lowScoreByBranch.resultsCard.loadingText')}
                                            </TableCell>
                                        </TableRow>
                                    ) : results.length > 0 ? (
                                        results.map((student) => (
                                            <Fragment key={student.studentId}>
                                                                             <TableRow>
                                                    <TableCell rowSpan={student.scores.length} className="text-center align-middle whitespace-nowrap">{student.studentId}</TableCell>
                                                    <TableCell rowSpan={student.scores.length} className="font-medium text-center align-middle whitespace-nowrap">{student.studentName}</TableCell>
                                                    <TableCell rowSpan={student.scores.length} className="text-center align-middle whitespace-nowrap">{student.grade}</TableCell>
                                                    
                                                    <TableCell className="text-center align-middle whitespace-nowrap">{student.scores[0].classId}</TableCell>
                                                    <TableCell className="text-center align-middle whitespace-nowrap">{student.scores[0].date}</TableCell>
                                                    <TableCell className="text-center align-middle font-bold text-red-600 whitespace-pre-wrap">
                                                        {student.scores[0].scoreDisplay}
                                                    </TableCell>
                                                    <TableCell className="align-middle whitespace-pre-wrap">{student.scores[0].comment}</TableCell>
                                                </TableRow>
                                                {student.scores.slice(1).map((score, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{score.classId}</TableCell>
                                                        <TableCell>{score.date}</TableCell>
                                                        <TableCell className="text-center font-bold text-red-600 whitespace-pre-wrap">
                                                            {score.scoreDisplay}
                                                        </TableCell>
                                                        <TableCell className="align-middle whitespace-pre-wrap">{score.comment}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-48 text-center">
                                                {t('lowScoreByBranch.resultsCard.noResults')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}