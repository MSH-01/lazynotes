import prettyBytes from 'pretty-bytes';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format bytes as human-readable file size
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '-';
  return prettyBytes(bytes);
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format date as absolute date/time
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}
