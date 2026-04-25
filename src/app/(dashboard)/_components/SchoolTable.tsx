import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type SchoolRow = {
  _id: string;
  name: string;
  email: string;
  totalStudents: number;
  totalAmount: number;
  status: string;
};

type SchoolTableProps = {
  schools: SchoolRow[];
  loading?: boolean;
};

export default function SchoolTable({ schools, loading = false }: SchoolTableProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-[18px] font-semibold text-[#0A0A0B]">
        School Lists
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#F9FAFB]">
            <tr className="border-b border-[#E5E7EB]">
              <th className="px-4 py-3 text-center text-[16px] font-bold text-[#6B7280]">
                School Name
              </th>
              <th className="px-4 py-3 text-center text-[16px] font-bold text-[#6B7280]">
                Email
              </th>
              <th className="px-4 py-3 text-center text-[16px] font-bold text-[#6B7280]">
                Total Students
              </th>
              <th className="px-4 py-3 text-center text-[16px] font-bold text-[#6B7280]">
                Total Amount
              </th>
              <th className="px-4 py-3 text-center text-[16px] font-bold text-[#6B7280]">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[16px] text-[#6B7280]">
                  Loading schools...
                </td>
              </tr>
            ) : schools.length ? (
              schools.map((school) => (
                <tr key={school._id} className="border-b border-[#E5E7EB]">
                  <td className="px-4 py-4 text-center text-[16px] font-normal text-[#0A0A0B]">
                    {school.name}
                  </td>
                  <td className="px-4 py-4 text-center text-[16px] font-normal text-[#0A0A0B]">
                    {school.email}
                  </td>
                  <td className="px-4 py-4 text-center text-[16px] font-normal text-[#0A0A0B]">
                    {school.totalStudents}
                  </td>
                  <td className="px-4 py-4 text-center text-[16px] font-normal text-[#0A0A0B]">
                    ${school.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium ${
                          school.status === "active"
                            ? "bg-[#D9FBE2] text-[#2F9E44]"
                            : "bg-[#FDE2E2] text-[#D92D20]"
                        }`}
                      >
                        {school.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[16px] text-[#6B7280]">
                  No schools found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <Link
          href="/school-list"
          className="inline-flex items-center gap-2 text-[16px] font-medium text-[#0B5280] transition hover:text-[#094570]"
        >
          View All
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
