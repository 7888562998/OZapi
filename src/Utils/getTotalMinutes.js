export function getTotalMinutes(startTime, endTime) {
    // Parse start and end times into Date objects
    const startDate = new Date('1970-01-01T' + startTime);
    const endDate = new Date('1970-01-01T' + endTime);
  
    // Calculate the difference between end and start times in milliseconds
    const differenceMs = endDate - startDate;
  
    // Convert milliseconds difference into minutes
    const totalMinutes = Math.round(differenceMs / (1000 * 60));
  
    return totalMinutes;
  }