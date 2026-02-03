import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  ArrowRight,
  UserPlus,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  getStatistics, 
  getStudents, 
  getPayments, 
  getCourses,
  getAttendance
} from '@/lib/storage';
import { format, parseISO, isBefore } from 'date-fns';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => {
    // Load data
    const statistics = getStatistics();
    setStats(statistics);
    
    const allStudents = getStudents();
    const sortedStudents = [...allStudents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    setRecentStudents(sortedStudents);
    
    const allPayments = getPayments();
    const pending = allPayments
      .filter(p => p.status === 'pending' || p.status === 'partial')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    setUpcomingPayments(pending);
    
    setCourses(getCourses());
    
    // Calculate today's attendance
    const today = new Date().toISOString().split('T')[0];
    const attendance = getAttendance().filter(a => a.date === today);
    setTodayAttendance({
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      total: attendance.length
    });
  }, []);

  const getStudentName = (studentId) => {
    const student = getStudents().find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back! Here's an overview of your institution.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/attendance">
              <Calendar className="mr-2 h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
          <Button asChild>
            <Link to="/students">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          description={`${stats.activeStudents} active`}
          variant="primary"
          trend="up"
          trendValue="+12% this month"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="From fee collections"
          variant="success"
          trend="up"
          trendValue="+8% this month"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          icon={CreditCard}
          description="Due from students"
          variant="warning"
        />
        <StatCard
          title="Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          description="Active programs"
          variant="info"
        />
      </div>

      {/* Today's Attendance Summary */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today's Attendance</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/attendance">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
              <CheckCircle className="mx-auto h-6 w-6 text-success" />
              <p className="mt-2 text-2xl font-bold text-foreground">{todayAttendance.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
              <p className="mt-2 text-2xl font-bold text-foreground">{todayAttendance.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 text-center">
              <Clock className="mx-auto h-6 w-6 text-warning" />
              <p className="mt-2 text-2xl font-bold text-foreground">{todayAttendance.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="rounded-lg border border-info/20 bg-info/5 p-4 text-center">
              <Calendar className="mx-auto h-6 w-6 text-info" />
              <p className="mt-2 text-2xl font-bold text-foreground">{todayAttendance.excused || 0}</p>
              <p className="text-xs text-muted-foreground">Excused</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Students */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Students</CardTitle>
                <CardDescription>Newly enrolled students</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/students">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentStudents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No students added yet
                </p>
              ) : (
                recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-sm font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{getCourseName(student.courseId)}</p>
                      </div>
                    </div>
                    <Badge variant={student.status === 'active' ? 'active' : 'inactive'}>
                      {student.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Upcoming Payments</CardTitle>
                <CardDescription>Pending fee installments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/payments">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No pending payments
                </p>
              ) : (
                upcomingPayments.map((payment) => {
                  const isOverdue = isBefore(parseISO(payment.dueDate), new Date());
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{getStudentName(payment.studentId)}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(parseISO(payment.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(payment.amount - (payment.paidAmount || 0))}
                        </p>
                        <Badge variant={isOverdue ? 'overdue' : payment.status}>
                          {isOverdue ? 'Overdue' : payment.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Overview */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Course Overview</CardTitle>
              <CardDescription>Active programs and enrollment</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/courses">
                Manage Courses
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => {
              const enrolledCount = getStudents().filter(s => s.courseId === course.id).length;
              return (
                <div
                  key={course.id}
                  className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{course.duration} {course.durationUnit}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{course.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">{enrolledCount} enrolled</span>
                    <span className="font-semibold text-primary">{formatCurrency(course.fee)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
