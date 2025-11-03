# Enrollment Form Module Structure

This directory contains the refactored enrollment form logic, split into manageable modules.

## File Structure

```
enrollment-form/
├── utils.tsx           # Shared utility functions (icon helpers, formatters, validators)
├── validation.tsx      # Enrollment availability and period validation
└── README.md          # This file

```

## Modules

### utils.tsx
Contains:
- `getSubjectIcon()` - Returns appropriate icon for subjects
- `getColorValue()` - Returns hex color for grade/course colors
- `formatPhoneNumber()` - Formats phone numbers to +63 format
- `isRegularGradeLevel()` - Checks if grade is entry level
- `isRegularYearSemester()` - Checks if college year/semester is entry level

### validation.tsx
Contains:
- `isEnrollmentAvailable()` - Checks if enrollment period is active
- `getEnrollmentPeriodMessage()` - Returns formatted period string
- `getEnrollmentDaysRemaining()` - Calculates days left in enrollment
- `getEnrollmentProgress()` - Calculates progress percentage

## Usage

Import functions from modules:

```typescript
import { getSubjectIcon, formatPhoneNumber } from './enrollment-form/utils';
import { isEnrollmentAvailable } from './enrollment-form/validation';
```

