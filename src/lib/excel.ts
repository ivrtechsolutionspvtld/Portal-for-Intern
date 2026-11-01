import * as XLSX from 'xlsx';

export interface StudentImportRow {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  graduationYear: number;
  domain: string;
  batchName?: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: StudentImportRow[];
  errors: ImportError[];
  duplicates: string[];
}

// Generate Excel Template for Student Import
export function generateStudentImportTemplate(): Buffer {
  const sampleData = [
    {
      'Full Name': 'Aarav Sharma',
      'Email': 'aarav.sharma@example.edu.in',
      'Phone': '+91 98765 43210',
      'College': 'Indian Institute of Technology, Bombay',
      'Department': 'Computer Science and Engineering',
      'Graduation Year': 2026,
      'Domain': 'Full-Stack Web Development',
      'Batch Name': 'Batch FS-2026-A',
    },
    {
      'Full Name': 'Ananya Deshmukh',
      'Email': 'ananya.d@example.edu.in',
      'Phone': '+91 98765 43211',
      'College': 'Veermata Jijabai Technological Institute (VJTI)',
      'Department': 'Information Technology',
      'Graduation Year': 2026,
      'Domain': 'Artificial Intelligence & Machine Learning',
      'Batch Name': 'Batch AI-2026-A',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_Import_Template');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Parse and validate uploaded Excel buffer
export function parseAndValidateStudentExcel(
  buffer: Buffer,
  existingEmails: Set<string>
): ImportValidationResult {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
  const errors: ImportError[] = [];
  const duplicates: string[] = [];
  const validRows: StudentImportRow[] = [];
  const seenInFile = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-based + header row
    const fullName = String(row['Full Name'] || row['fullName'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim().toLowerCase();
    const phone = String(row['Phone'] || row['phone'] || '').trim();
    const college = String(row['College'] || row['college'] || '').trim();
    const department = String(row['Department'] || row['department'] || '').trim();
    const gradYearRaw = row['Graduation Year'] || row['graduationYear'];
    const domain = String(row['Domain'] || row['domain'] || '').trim();
    const batchName = String(row['Batch Name'] || row['batchName'] || '').trim();

    if (!fullName) {
      errors.push({ row: rowNum, field: 'Full Name', message: 'Full name is required' });
    }

    if (!email || !email.includes('@')) {
      errors.push({ row: rowNum, field: 'Email', message: 'Valid email address is required' });
    } else {
      if (seenInFile.has(email)) {
        duplicates.push(`Row ${rowNum}: Duplicate email "${email}" in file`);
        errors.push({ row: rowNum, field: 'Email', message: 'Duplicate email within uploaded file' });
      } else if (existingEmails.has(email)) {
        duplicates.push(`Row ${rowNum}: Email "${email}" already registered in database`);
        errors.push({ row: rowNum, field: 'Email', message: 'User with this email already exists' });
      }
      seenInFile.add(email);
    }

    const gradYear = Number(gradYearRaw);
    if (!gradYear || gradYear < 2020 || gradYear > 2035) {
      errors.push({ row: rowNum, field: 'Graduation Year', message: 'Graduation year must be between 2020 and 2035' });
    }

    if (!college) {
      errors.push({ row: rowNum, field: 'College', message: 'College name is required' });
    }

    if (!domain) {
      errors.push({ row: rowNum, field: 'Domain', message: 'Internship domain is required' });
    }

    const hasRowErrors = errors.some((e) => e.row === rowNum);
    if (!hasRowErrors) {
      validRows.push({
        fullName,
        email,
        phone,
        college,
        department,
        graduationYear: gradYear,
        domain,
        batchName: batchName || undefined,
      });
    }
  });

  return {
    valid: errors.length === 0,
    totalRows: rawRows.length,
    validRows,
    errors,
    duplicates,
  };
}

// Export data to Excel
export function exportToExcel(data: Record<string, unknown>[], sheetName = 'Report'): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
