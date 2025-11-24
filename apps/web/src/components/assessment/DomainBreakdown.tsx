"use client";

import { DomainPerformance } from "@/types/assessment";

interface DomainBreakdownProps {
  domainPerformance: DomainPerformance[];
}

export function DomainBreakdown({ domainPerformance }: DomainBreakdownProps) {
  return (
    <div className="border-2 border-black dark:border-white p-8 bg-white dark:bg-gray-900">
      <h3 className="text-xl font-bold mb-6 text-black dark:text-white">
        Breakdown of Exam Results
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black dark:border-white">
              <th className="text-left p-3 font-bold text-black dark:text-white">
                Section
              </th>
              <th className="text-center p-3 font-bold text-black dark:text-white">
                % of Items
              </th>
              <th className="text-center p-3 font-bold text-black dark:text-white">
                Needs Improve
              </th>
              <th className="text-center p-3 font-bold text-black dark:text-white">
                Meets Comp.
              </th>
            </tr>
          </thead>
          <tbody>
            {domainPerformance.map((domain) => {
              const meetsCompetency = domain.competency === "MEETS";

              return (
                <tr
                  key={domain.domain}
                  className="border-b border-gray-300 dark:border-gray-600"
                >
                  <td className="p-3 font-semibold text-black dark:text-white">
                    {domain.domainName}
                  </td>
                  <td className="p-3 text-center font-mono text-black dark:text-white">
                    {domain.percentage}%
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className={`inline-block w-6 h-6 border-2 ${
                        meetsCompetency
                          ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                          : "border-[#EF4444] bg-[#EF4444]"
                      }`}
                    >
                      {!meetsCompetency && (
                        <div className="w-full h-full bg-[#EF4444]" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className={`inline-block w-6 h-6 border-2 ${
                        meetsCompetency
                          ? "border-[#FF9900] bg-[#FF9900]"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      }`}
                    >
                      {meetsCompetency && (
                        <div className="w-full h-full bg-[#FF9900]" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
