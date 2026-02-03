import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  Clock,
  AlertCircle,
  Save,
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  getStudents, 
  getCourses, 
  getAttendance, 
  addAttendanceRecord, 
  updateAttendanceRecord,
  getAttendanceByDate 
} from '@/lib/storage';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present', icon: Check, color: 'text-success', bg: 'bg-success/10' },
  { value: 'absent', label: 'Absent', icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
  { value: 'late', label: 'Late', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  { value: 'excused', label: 'Excused', icon: AlertCircle, color: 'text-info', bg: 'bg-info/10' },
];

export const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [courseFilter, setCourseFilter] = useState('all');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const loadData = React.useCallback(() => {
    setStudents(getStudents().filter(s => s.status === 'active'));
    setCourses(getCourses());
  }, []);

  const loadAttendanceForDate = React.useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const records = getAttendanceByDate(dateStr);
    const dataMap = {};
    records.forEach(record => {
      dataMap[record.studentId] = record;
    });
    setAttendanceData(dataMap);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadAttendanceForDate(selectedDate);
  }, [selectedDate, loadAttendanceForDate]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown';
  };

  const filteredStudents = students.filter(student => {
    return courseFilter === 'all' || student.courseId === courseFilter;
  });

  const handleStatusChange = (studentId, status) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendanceData[studentId];
    
    if (existing) {
      updateAttendanceRecord(existing.id, { status });
    } else {
      addAttendanceRecord({
        studentId,
        date: dateStr,
        status,
        notes: ''
      });
    }
    
    loadAttendanceForDate(selectedDate);
    toast.success(`Marked ${status} for student`);
  };

  const handleAddNote = (studentId) => {
    const existing = attendanceData[studentId];
    setSelectedRecord({ studentId, existing });
    setNoteText(existing?.notes || '');
    setNoteDialogOpen(true);
  };

  const saveNote = () => {
    if (!selectedRecord) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { studentId, existing } = selectedRecord;
    
    if (existing) {
      updateAttendanceRecord(existing.id, { notes: noteText });
    } else {
      addAttendanceRecord({
        studentId,
        date: dateStr,
        status: 'present',
        notes: noteText
      });
    }
    
    loadAttendanceForDate(selectedDate);
    setNoteDialogOpen(false);
    setSelectedRecord(null);
    toast.success('Note saved');
  };

  const markAllPresent = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    filteredStudents.forEach(student => {
      const existing = attendanceData[student.id];
      if (existing) {
        updateAttendanceRecord(existing.id, { status: 'present' });
      } else {
        addAttendanceRecord({
          studentId: student.id,
          date: dateStr,
          status: 'present',
          notes: ''
        });
      }
    });
    loadAttendanceForDate(selectedDate);
    toast.success('All students marked present');
  };

  const getMonthlyData = (studentId) => {
    const attendance = getAttendance();
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      if (isWeekend(day)) return { date: day, status: 'weekend' };
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = attendance.find(a => a.studentId === studentId && a.date === dateStr);
      return { date: day, status: record?.status || null };
    });
  };

  const getStatusIcon = (status) => {
    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return <Icon className={cn('h-4 w-4', statusConfig.color)} />;
  };

  const getStatusBadge = (status) => {
    if (!status || status === 'weekend') return null;
    return <Badge variant={status}>{status}</Badge>;
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    const records = Object.values(attendanceData);
    return {
      total: filteredStudents.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
      unmarked: filteredStudents.length - records.length
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage student attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            Daily View
          </Button>
          <Button 
            variant={viewMode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('monthly')}
          >
            Monthly View
          </Button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* Date Selection & Stats */}
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="shadow-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="space-y-2">
                  <Label>Filter by Course</Label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={markAllPresent} variant="outline" className="w-full">
                  <Check className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
              <Card className="border-success/20 bg-success/5 shadow-card">
                <CardContent className="p-4 text-center">
                  <Check className="mx-auto h-6 w-6 text-success" />
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5 shadow-card">
                <CardContent className="p-4 text-center">
                  <X className="mx-auto h-6 w-6 text-destructive" />
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card className="border-warning/20 bg-warning/5 shadow-card">
                <CardContent className="p-4 text-center">
                  <Clock className="mx-auto h-6 w-6 text-warning" />
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </CardContent>
              </Card>
              <Card className="border-border shadow-card">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-2xl font-bold text-foreground">{stats.unmarked}</p>
                  <p className="text-xs text-muted-foreground">Unmarked</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Attendance Table */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Attendance for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <CardDescription>{filteredStudents.length} students</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Mark Attendance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => {
                        const record = attendanceData[student.id];
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <span className="text-sm font-semibold">
                                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getCourseName(student.courseId)}</TableCell>
                            <TableCell>
                              {record ? (
                                <Badge variant={record.status}>{record.status}</Badge>
                              ) : (
                                <Badge variant="secondary">Not marked</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                {ATTENDANCE_STATUSES.map((status) => {
                                  const Icon = status.icon;
                                  const isActive = record?.status === status.value;
                                  return (
                                    <Button
                                      key={status.value}
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        'h-9 w-9 rounded-full transition-all',
                                        isActive && status.bg,
                                        isActive && 'ring-2 ring-offset-2',
                                        status.value === 'present' && isActive && 'ring-success',
                                        status.value === 'absent' && isActive && 'ring-destructive',
                                        status.value === 'late' && isActive && 'ring-warning',
                                        status.value === 'excused' && isActive && 'ring-info'
                                      )}
                                      onClick={() => handleStatusChange(student.id, status.value)}
                                      title={status.label}
                                    >
                                      <Icon className={cn('h-4 w-4', status.color)} />
                                    </Button>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddNote(student.id)}
                                className="text-muted-foreground"
                              >
                                {record?.notes ? (
                                  <span className="max-w-[150px] truncate text-xs">{record.notes}</span>
                                ) : (
                                  'Add note'
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Monthly View */
        <>
          {/* Month Navigation */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Attendance Grid */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Attendance Overview</CardTitle>
              <CardDescription>Click on a cell to view/edit attendance</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 bg-card">Student</TableHead>
                      {eachDayOfInterval({
                        start: startOfMonth(currentMonth),
                        end: endOfMonth(currentMonth)
                      }).map((day) => (
                        <TableHead 
                          key={day.toISOString()} 
                          className={cn(
                            'min-w-[40px] p-1 text-center text-xs',
                            isWeekend(day) && 'bg-muted/50'
                          )}
                        >
                          <div>{format(day, 'd')}</div>
                          <div className="text-[10px] text-muted-foreground">{format(day, 'EEE')}</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const monthData = getMonthlyData(student.id);
                      const workingDays = monthData.filter(d => d.status !== 'weekend');
                      const presentDays = workingDays.filter(d => d.status === 'present' || d.status === 'late').length;
                      const attendancePercent = workingDays.length > 0 
                        ? Math.round((presentDays / workingDays.length) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 z-10 bg-card">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="text-xs font-semibold">
                                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <span className="max-w-[120px] truncate text-sm font-medium">{student.name}</span>
                            </div>
                          </TableCell>
                          {monthData.map((day, idx) => (
                            <TableCell 
                              key={idx} 
                              className={cn(
                                'p-1 text-center',
                                day.status === 'weekend' && 'bg-muted/50',
                                day.status === 'present' && 'bg-success/10',
                                day.status === 'absent' && 'bg-destructive/10',
                                day.status === 'late' && 'bg-warning/10',
                                day.status === 'excused' && 'bg-info/10'
                              )}
                            >
                              {day.status !== 'weekend' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSelectedDate(day.date);
                                    setViewMode('daily');
                                  }}
                                >
                                  {day.status ? getStatusIcon(day.status) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Badge 
                              variant={attendancePercent >= 75 ? 'present' : attendancePercent >= 50 ? 'late' : 'absent'}
                            >
                              {attendancePercent}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-muted-foreground">Legend:</span>
            {ATTENDANCE_STATUSES.map((status) => (
              <div key={status.value} className="flex items-center gap-1.5">
                <div className={cn('h-4 w-4 rounded', status.bg)} />
                <span className="text-muted-foreground">{status.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded bg-muted/50" />
              <span className="text-muted-foreground">Weekend</span>
            </div>
          </div>
        </>
      )}

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attendance Note</DialogTitle>
            <DialogDescription>
              Add a note for this attendance record (e.g., reason for absence, late arrival time)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter note..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>
              <Save className="mr-2 h-4 w-4" />
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
