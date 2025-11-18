'use client'

import {
  Users,
  GraduationCap,
  BookOpen,
  MemberOfIcon,
  User,
  Calendar,
  Clock,
  ChartBar,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Gear,
  UserList,
  Student,
  Books,
  ListChecks,
  WarningCircle,
  GraduationCap as GraduationCapIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChartBar as ChartBarIcon,
  FileText as FileTextIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Plus as PlusIcon,
  Eye as EyeIcon,
  Gear as GearIcon,
  UserList as UserListIcon,
  Student as StudentIcon,
  Books as BooksIcon,
} from '@phosphor-icons/react'

export const registrarIcons = {
  Users,
  GraduationCap,
  BookOpen,
  MemberOfIcon,
  User,
  Calendar,
  Clock,
  ChartBar,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Gear,
  UserList,
  Student,
  Books,
  ListChecks,
  WarningCircle,
  GraduationCapIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon,
  GearIcon,
  UserListIcon,
  StudentIcon,
  BooksIcon,
} as const

type RegistrarOverviewProps = {
  registrarUid: string
}

const RegistrarOverview = ({ registrarUid }: RegistrarOverviewProps) => {
  if (!registrarUid) return null
  return null
}

export default RegistrarOverview
