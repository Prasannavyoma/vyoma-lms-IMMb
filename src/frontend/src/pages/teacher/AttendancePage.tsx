import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarCheck,
  CheckCircle,
  FileSpreadsheet,
  Save,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { lmsStore } from "../../store/lmsStore";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Student,
} from "../../types/lms";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function ManualAttendance({
  students,
  teacherId,
}: {
  students: Student[];
  teacherId: string;
}) {
  const [date, setDate] = useState(getTodayDate);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    {},
  );

  useEffect(() => {
    // Load existing records for selected date
    const records = lmsStore.getAttendance();
    const map: Record<string, AttendanceStatus> = {};
    for (const student of students) {
      const rec = records.find(
        (r) => r.studentId === student.id && r.date === date,
      );
      map[student.id] = rec?.status ?? "present";
    }
    setStatuses(map);
  }, [date, students]);

  const handleSave = () => {
    for (const student of students) {
      const status = statuses[student.id] ?? "present";
      lmsStore.upsertAttendanceRecord(student.id, teacherId, date, status);
    }
    toast.success(`Attendance saved for ${date}.`);
  };

  if (students.length === 0) {
    return (
      <div
        className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl"
        data-ocid="attendance.manual.empty_state"
      >
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No students enrolled yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
            data-ocid="attendance.date.input"
          />
        </div>
        <Button onClick={handleSave} data-ocid="attendance.save.primary_button">
          <Save className="w-4 h-4 mr-2" />
          Save Attendance
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Roll No.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, i) => (
              <TableRow key={student.id} data-ocid={`attendance.item.${i + 1}`}>
                <TableCell className="font-medium text-sm">
                  {student.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {student.rollNumber || "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={statuses[student.id] ?? "present"}
                    onValueChange={(v) =>
                      setStatuses((prev) => ({
                        ...prev,
                        [student.id]: v as AttendanceStatus,
                      }))
                    }
                  >
                    <SelectTrigger
                      className="w-32 h-8 text-sm"
                      data-ocid={`attendance.status.select.${i + 1}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type ParsedRow = {
  studentId: string;
  name: string;
  date: string;
  status: AttendanceStatus;
  found: boolean;
};

function CsvUpload({
  students,
  teacherId,
}: {
  students: Student[];
  teacherId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows: ParsedRow[] = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) continue;
        const [sid, date, rawStatus] = parts;
        const statusNorm = rawStatus.toLowerCase() as AttendanceStatus;
        if (!["present", "absent", "late"].includes(statusNorm)) continue;
        const student = students.find(
          (s) =>
            s.id === sid ||
            s.rollNumber.toLowerCase() === sid.toLowerCase() ||
            s.username.toLowerCase() === sid.toLowerCase(),
        );
        rows.push({
          studentId: student?.id ?? sid,
          name: student?.name ?? sid,
          date,
          status: statusNorm,
          found: !!student,
        });
      }
      setParsed(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    setImporting(true);
    let count = 0;
    for (const row of parsed) {
      if (!row.found) continue;
      lmsStore.upsertAttendanceRecord(
        row.studentId,
        teacherId,
        row.date,
        row.status,
      );
      count++;
    }
    setImporting(false);
    setParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`Imported ${count} attendance record(s).`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-muted/40 border rounded-xl p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">CSV Format</p>
        <p>
          Each row:{" "}
          <code className="bg-muted px-1 rounded">StudentID,Date,Status</code>
        </p>
        <p>
          • StudentID can be the student&apos;s ID, roll number, or username
        </p>
        <p>
          • Date format:{" "}
          <code className="bg-muted px-1 rounded">YYYY-MM-DD</code>
        </p>
        <p>
          • Status: <code className="bg-muted px-1 rounded">present</code>,{" "}
          <code className="bg-muted px-1 rounded">absent</code>, or{" "}
          <code className="bg-muted px-1 rounded">late</code>
        </p>
      </div>

      <div>
        <label
          className="flex items-center gap-2 cursor-pointer px-4 py-2.5 border-2 border-dashed rounded-xl text-sm hover:border-primary/50 hover:bg-muted/40 transition-colors w-fit"
          htmlFor="csv-upload"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Choose CSV File
        </label>
        <input
          id="csv-upload"
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFile}
          data-ocid="attendance.upload_button"
        />
      </div>

      {parsed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((row, i) => (
                  <TableRow key={`${row.name}-${row.date}-${i}`}>
                    <TableCell className="text-sm">{row.name}</TableCell>
                    <TableCell className="text-sm">{row.date}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[row.status]
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.found ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-xs text-red-500">Not found</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button
            onClick={handleImport}
            disabled={importing || parsed.every((r) => !r.found)}
            data-ocid="attendance.import.primary_button"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import {parsed.filter((r) => r.found).length} Record(s)
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function AttendanceHistory({
  students,
  teacherId,
}: {
  students: Student[];
  teacherId: string;
}) {
  const [filterStudentId, setFilterStudentId] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const refresh = useCallback(() => {
    const all = lmsStore
      .getAttendance()
      .filter((r) => r.teacherId === teacherId);
    setRecords(all);
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = records.filter((r) => {
    if (filterStudentId !== "all" && r.studentId !== filterStudentId)
      return false;
    if (filterFrom && r.date < filterFrom) return false;
    if (filterTo && r.date > filterTo) return false;
    return true;
  });

  const getStudentName = (id: string) =>
    students.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Filter by Student</Label>
          <Select value={filterStudentId} onValueChange={setFilterStudentId}>
            <SelectTrigger
              className="w-48 h-8 text-sm"
              data-ocid="attendance.filter.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-36 h-8 text-sm"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-36 h-8 text-sm"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground text-sm"
          data-ocid="attendance.history.empty_state"
        >
          <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No attendance records found.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filtered]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((rec, i) => (
                  <TableRow
                    key={rec.id}
                    data-ocid={`attendance.history.item.${i + 1}`}
                  >
                    <TableCell className="text-sm">{rec.date}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {getStudentName(rec.studentId)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[rec.status]
                        }`}
                      >
                        {rec.status.charAt(0).toUpperCase() +
                          rec.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  const { session } = useApp();
  const [students, setStudents] = useState<Student[]>([]);

  const teacherId = session?.type === "staff" ? session.user.id : "";

  const refresh = useCallback(() => {
    if (!teacherId) return;
    setStudents(
      lmsStore.getStudents().filter((s) => s.teacherId === teacherId),
    );
  }, [teacherId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || session.type !== "staff") return null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track and manage student attendance
        </p>
      </div>

      <Tabs defaultValue="manual" data-ocid="attendance.tab">
        <TabsList className="mb-6">
          <TabsTrigger value="manual" data-ocid="attendance.manual.tab">
            Manual Attendance
          </TabsTrigger>
          <TabsTrigger value="csv" data-ocid="attendance.csv.tab">
            Upload CSV
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="attendance.history.tab">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <ManualAttendance students={students} teacherId={teacherId} />
        </TabsContent>
        <TabsContent value="csv">
          <CsvUpload students={students} teacherId={teacherId} />
        </TabsContent>
        <TabsContent value="history">
          <AttendanceHistory students={students} teacherId={teacherId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
