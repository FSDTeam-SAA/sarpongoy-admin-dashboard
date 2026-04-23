import Link from "next/link";
import { ArrowRight, Eye, Trash2 } from "lucide-react";

// TODO: replace with API call
const schools = [
  {
    name: "Cambridge School",
    email: "jon@gmail.com",
    totalStudents: 200,
    totalAmount: "$5,000",
  },
  {
    name: "Oxford International School",
    email: "jon@gmail.com",
    totalStudents: 45,
    totalAmount: "$5,000",
  },
];

export default function SchoolTable() {
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
            {schools.map((school) => (
              <tr key={school.name} className="border-b border-[#E5E7EB]">
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
                  {school.totalAmount}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="text-[#0A0A0B] transition hover:text-[#0B5280]"
                      aria-label={`View ${school.name}`}
                    >
                      <Eye className="size-5" />
                    </button>
                    <button
                      type="button"
                      className="text-red-500 transition hover:text-red-600"
                      aria-label={`Delete ${school.name}`}
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
