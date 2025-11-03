// Validation and enrollment period helpers

export const isEnrollmentAvailable = (
  level: 'high-school' | 'college',
  enrollmentStartPeriodHS: string | null,
  enrollmentEndPeriodHS: string | null,
  enrollmentStartPeriodCollege: string | null,
  enrollmentEndPeriodCollege: string | null
): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (level === 'high-school') {
    if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) {
      return false;
    }
    const startDate = new Date(enrollmentStartPeriodHS);
    const endDate = new Date(enrollmentEndPeriodHS);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return today >= startDate && today <= endDate;
  } else {
    if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) {
      return false;
    }
    const startDate = new Date(enrollmentStartPeriodCollege);
    const endDate = new Date(enrollmentEndPeriodCollege);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return today >= startDate && today <= endDate;
  }
};

export const getEnrollmentPeriodMessage = (
  level: 'high-school' | 'college',
  enrollmentStartPeriodHS: string | null,
  enrollmentEndPeriodHS: string | null,
  enrollmentStartPeriodCollege: string | null,
  enrollmentEndPeriodCollege: string | null
): string | null => {
  if (level === 'high-school') {
    if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) {
      return null;
    }
    const startDate = new Date(enrollmentStartPeriodHS);
    const endDate = new Date(enrollmentEndPeriodHS);
    return `Enrollment Period: ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) {
      return null;
    }
    const startDate = new Date(enrollmentStartPeriodCollege);
    const endDate = new Date(enrollmentEndPeriodCollege);
    return `Enrollment Period: ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
};

export const getEnrollmentDaysRemaining = (
  level: 'high-school' | 'college',
  enrollmentEndPeriodHS: string | null,
  enrollmentEndPeriodCollege: string | null
): number | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let endDate: Date | null = null;
  
  if (level === 'high-school') {
    if (!enrollmentEndPeriodHS) return null;
    endDate = new Date(enrollmentEndPeriodHS);
  } else {
    if (!enrollmentEndPeriodCollege) return null;
    endDate = new Date(enrollmentEndPeriodCollege);
  }

  if (!endDate) return null;
  endDate.setHours(23, 59, 59, 999);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 ? diffDays : 0;
};

export const getEnrollmentProgress = (
  level: 'high-school' | 'college',
  enrollmentStartPeriodHS: string | null,
  enrollmentEndPeriodHS: string | null,
  enrollmentStartPeriodCollege: string | null,
  enrollmentEndPeriodCollege: string | null
): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
  if (level === 'high-school') {
    if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) return 0;
    startDate = new Date(enrollmentStartPeriodHS);
    endDate = new Date(enrollmentEndPeriodHS);
  } else {
    if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) return 0;
    startDate = new Date(enrollmentStartPeriodCollege);
    endDate = new Date(enrollmentEndPeriodCollege);
  }

  if (!startDate || !endDate) return 0;

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (today < startDate) return 100;
  if (today > endDate) return 0;

  const totalDuration = endDate.getTime() - startDate.getTime();
  const remaining = endDate.getTime() - today.getTime();
  
  const progress = Math.min(100, Math.max(0, (remaining / totalDuration) * 100));
  return progress;
};

