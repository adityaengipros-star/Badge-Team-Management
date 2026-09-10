import {
  Bug,
  Code2,
  Sparkles,
  ArrowUpCircle,
  Search,
  FileText,
  FlaskConical,
  Wrench,
  Star,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";
import type { TaskType } from "@/types";

// One consistent icon per task type — so type is never conveyed by colour alone.
export const TASK_TYPE_ICON: Record<TaskType, LucideIcon> = {
  Issue: CircleAlert,
  Development: Code2,
  Bug: Bug,
  Enhancement: Sparkles,
  Upgrade: ArrowUpCircle,
  Research: Search,
  Documentation: FileText,
  Testing: FlaskConical,
  Maintenance: Wrench,
  Feature: Star,
};
