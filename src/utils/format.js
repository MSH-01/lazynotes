import prettyBytes from 'pretty-bytes';
import { formatDistanceToNow, format } from 'date-fns';

export function formatFileSize(bytes) {
  if (bytes == null) return '-';
  return prettyBytes(bytes);
}

export function formatRelativeDate(date) {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date) {
  if (!date) return '-';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}
