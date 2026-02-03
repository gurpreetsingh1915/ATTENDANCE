// Local Storage utility functions for Student Management System

const STORAGE_KEYS = {
  STUDENTS: 'sms_students',
  COURSES: 'sms_courses',
  ATTENDANCE: 'sms_attendance',
  PAYMENTS: 'sms_payments',
};

// Generic storage functions
export const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error);
    return false;
  }
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Course functions
export const getCourses = () => {
  return getFromStorage(STORAGE_KEYS.COURSES) || [];
};

export const saveCourses = (courses) => {
  return saveToStorage(STORAGE_KEYS.COURSES, courses);
};

export const addCourse = (course) => {
  const courses = getCourses();
  const newCourse = { ...course, id: generateId(), createdAt: new Date().toISOString() };
  courses.push(newCourse);
  saveCourses(courses);
  return newCourse;
};

export const updateCourse = (id, updates) => {
  const courses = getCourses();
  const index = courses.findIndex(c => c.id === id);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...updates, updatedAt: new Date().toISOString() };
    saveCourses(courses);
    return courses[index];
  }
  return null;
};

export const deleteCourse = (id) => {
  const courses = getCourses();
  const filtered = courses.filter(c => c.id !== id);
  saveCourses(filtered);
  return filtered;
};

// Student functions
export const getStudents = () => {
  return getFromStorage(STORAGE_KEYS.STUDENTS) || [];
};

export const saveStudents = (students) => {
  return saveToStorage(STORAGE_KEYS.STUDENTS, students);
};

export const addStudent = (student) => {
  const students = getStudents();
  const newStudent = { 
    ...student, 
    id: generateId(), 
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
};

export const updateStudent = (id, updates) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates, updatedAt: new Date().toISOString() };
    saveStudents(students);
    return students[index];
  }
  return null;
};

export const deleteStudent = (id) => {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== id);
  saveStudents(filtered);
  // Also delete related attendance and payments
  deleteStudentAttendance(id);
  deleteStudentPayments(id);
  return filtered;
};

// Attendance functions
export const getAttendance = () => {
  return getFromStorage(STORAGE_KEYS.ATTENDANCE) || [];
};

export const saveAttendance = (attendance) => {
  return saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
};

export const addAttendanceRecord = (record) => {
  const attendance = getAttendance();
  const newRecord = { ...record, id: generateId(), recordedAt: new Date().toISOString() };
  attendance.push(newRecord);
  saveAttendance(attendance);
  return newRecord;
};

export const updateAttendanceRecord = (id, updates) => {
  const attendance = getAttendance();
  const index = attendance.findIndex(a => a.id === id);
  if (index !== -1) {
    attendance[index] = { ...attendance[index], ...updates, updatedAt: new Date().toISOString() };
    saveAttendance(attendance);
    return attendance[index];
  }
  return null;
};

export const getStudentAttendance = (studentId) => {
  const attendance = getAttendance();
  return attendance.filter(a => a.studentId === studentId);
};

export const getAttendanceByDate = (date) => {
  const attendance = getAttendance();
  return attendance.filter(a => a.date === date);
};

export const deleteStudentAttendance = (studentId) => {
  const attendance = getAttendance();
  const filtered = attendance.filter(a => a.studentId !== studentId);
  saveAttendance(filtered);
};

export const deleteAttendanceRecord = (id) => {
  const attendance = getAttendance();
  const filtered = attendance.filter(a => a.id !== id);
  saveAttendance(filtered);
  return filtered;
};

// Payment functions
export const getPayments = () => {
  return getFromStorage(STORAGE_KEYS.PAYMENTS) || [];
};

export const savePayments = (payments) => {
  return saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
};

export const addPayment = (payment) => {
  const payments = getPayments();
  const newPayment = { ...payment, id: generateId(), createdAt: new Date().toISOString() };
  payments.push(newPayment);
  savePayments(payments);
  return newPayment;
};

export const updatePayment = (id, updates) => {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === id);
  if (index !== -1) {
    payments[index] = { ...payments[index], ...updates, updatedAt: new Date().toISOString() };
    savePayments(payments);
    return payments[index];
  }
  return null;
};

export const deletePayment = (id) => {
  const payments = getPayments();
  const filtered = payments.filter(p => p.id !== id);
  savePayments(filtered);
  return filtered;
};

export const getStudentPayments = (studentId) => {
  const payments = getPayments();
  return payments.filter(p => p.studentId === studentId);
};

export const deleteStudentPayments = (studentId) => {
  const payments = getPayments();
  const filtered = payments.filter(p => p.studentId !== studentId);
  savePayments(filtered);
};

// Initialize with sample data if empty
export const initializeSampleData = () => {
  const courses = getCourses();
  const students = getStudents();
  
  if (courses.length === 0) {
    const sampleCourses = [
      { name: 'Web Development', duration: 6, durationUnit: 'months', fee: 15000, description: 'Full-stack web development course' },
      { name: 'Data Science', duration: 8, durationUnit: 'months', fee: 20000, description: 'Python, ML, and Data Analytics' },
      { name: 'UI/UX Design', duration: 4, durationUnit: 'months', fee: 12000, description: 'Design thinking and tools' },
      { name: 'Mobile App Development', duration: 6, durationUnit: 'months', fee: 18000, description: 'React Native & Flutter' },
    ];
    
    sampleCourses.forEach(course => addCourse(course));
  }
  
  if (students.length === 0) {
    const coursesData = getCourses();
    const sampleStudents = [
      { name: 'Rahul Sharma', email: 'rahul.sharma@email.com', phone: '9876543210', courseId: coursesData[0]?.id, joiningDate: '2024-01-15', endDate: '2024-07-15' },
      { name: 'Priya Patel', email: 'priya.patel@email.com', phone: '9876543211', courseId: coursesData[1]?.id, joiningDate: '2024-02-01', endDate: '2024-10-01' },
      { name: 'Amit Kumar', email: 'amit.kumar@email.com', phone: '9876543212', courseId: coursesData[0]?.id, joiningDate: '2024-01-20', endDate: '2024-07-20' },
      { name: 'Sneha Gupta', email: 'sneha.gupta@email.com', phone: '9876543213', courseId: coursesData[2]?.id, joiningDate: '2024-03-01', endDate: '2024-07-01' },
      { name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '9876543214', courseId: coursesData[3]?.id, joiningDate: '2024-02-15', endDate: '2024-08-15' },
    ];
    
    const addedStudents = sampleStudents.map(student => addStudent(student));
    
    // Add sample payments
    addedStudents.forEach((student, index) => {
      const course = coursesData.find(c => c.id === student.courseId);
      if (course) {
        const installmentAmount = course.fee / 3;
        
        // First installment - paid
        addPayment({
          studentId: student.id,
          amount: installmentAmount,
          dueDate: student.joiningDate,
          paidDate: student.joiningDate,
          paidAmount: installmentAmount,
          status: 'paid',
          installmentNumber: 1,
          notes: 'Initial payment'
        });
        
        // Second installment - varies by student
        const secondDueDate = new Date(student.joiningDate);
        secondDueDate.setMonth(secondDueDate.getMonth() + 2);
        
        if (index < 2) {
          addPayment({
            studentId: student.id,
            amount: installmentAmount,
            dueDate: secondDueDate.toISOString().split('T')[0],
            paidDate: secondDueDate.toISOString().split('T')[0],
            paidAmount: installmentAmount,
            status: 'paid',
            installmentNumber: 2,
            notes: 'Second installment'
          });
        } else if (index === 2) {
          addPayment({
            studentId: student.id,
            amount: installmentAmount,
            dueDate: secondDueDate.toISOString().split('T')[0],
            paidDate: null,
            paidAmount: installmentAmount / 2,
            status: 'partial',
            installmentNumber: 2,
            notes: 'Partial payment received'
          });
        } else {
          addPayment({
            studentId: student.id,
            amount: installmentAmount,
            dueDate: secondDueDate.toISOString().split('T')[0],
            paidDate: null,
            paidAmount: 0,
            status: 'pending',
            installmentNumber: 2,
            notes: ''
          });
        }
        
        // Third installment - pending for all
        const thirdDueDate = new Date(student.joiningDate);
        thirdDueDate.setMonth(thirdDueDate.getMonth() + 4);
        addPayment({
          studentId: student.id,
          amount: installmentAmount,
          dueDate: thirdDueDate.toISOString().split('T')[0],
          paidDate: null,
          paidAmount: 0,
          status: 'pending',
          installmentNumber: 3,
          notes: 'Final installment'
        });
      }
    });
    
    // Add sample attendance for the last 7 days
    const statuses = ['present', 'present', 'present', 'absent', 'late', 'present', 'excused'];
    addedStudents.forEach(student => {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        addAttendanceRecord({
          studentId: student.id,
          date: dateStr,
          status: randomStatus,
          notes: randomStatus === 'excused' ? 'Medical leave' : randomStatus === 'late' ? 'Traffic delay' : ''
        });
      }
    });
  }
};

// Calculate statistics
export const getStatistics = () => {
  const students = getStudents();
  const payments = getPayments();
  const attendance = getAttendance();
  const courses = getCourses();
  
  const activeStudents = students.filter(s => s.status === 'active').length;
  
  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  
  const pendingPayments = payments
    .filter(p => p.status === 'pending' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round((presentToday / todayAttendance.length) * 100) 
    : 0;
  
  return {
    totalStudents: students.length,
    activeStudents,
    totalCourses: courses.length,
    totalRevenue,
    pendingPayments,
    attendanceRate,
    presentToday,
    totalTodayRecords: todayAttendance.length
  };
};
