import React from "react";
import { format, differenceInDays } from "date-fns";

export default function PrintableEstrousReport({ animal, cycles }) {
  const observedCycles = cycles.filter(c => c.cycle_type === "observed");
  const predictedCycles = cycles.filter(c => c.cycle_type === "predicted");

  // Calculate average cycle length
  const cycleLengths = [];
  for (let i = 0; i < observedCycles.length - 1; i++) {
    const daysBetween = differenceInDays(
      new Date(observedCycles[i].cycle_start_date),
      new Date(observedCycles[i + 1].cycle_start_date)
    );
    cycleLengths.push(daysBetween);
  }
  const avgCycleLength = cycleLengths.length > 0 
    ? (cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length).toFixed(1)
    : "N/A";

  return (
    <div className="print-only-content p-8 bg-white">
      <style>{`
        @media print {
          .print-only-content {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          .print-only-content, .print-only-content * {
            visibility: visible;
          }
          .print-only-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5in;
          }
        }
        .print-only-content {
          display: none;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Estrous Cycle Tracking Report</h1>
        <div className="text-sm text-gray-600">
          <p>Generated: {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
        </div>
      </div>

      {/* Animal Information */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-3">Animal Information</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name/Tag:</p>
            <p className="font-semibold">{animal.name_or_tag}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type:</p>
            <p className="font-semibold capitalize">{animal.animal_type.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Breed:</p>
            <p className="font-semibold">{animal.breed || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Cycle Statistics */}
      <div className="mb-6 bg-purple-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-3">Cycle Statistics</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Cycles Tracked:</p>
            <p className="font-semibold text-2xl">{observedCycles.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Cycle Length:</p>
            <p className="font-semibold text-2xl">{avgCycleLength} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Heat Date:</p>
            <p className="font-semibold">{observedCycles.length > 0 ? format(new Date(observedCycles[0].cycle_start_date), 'MMM d, yyyy') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Predicted Heat:</p>
            <p className="font-semibold">{predictedCycles.length > 0 ? format(new Date(predictedCycles[0].cycle_start_date), 'MMM d, yyyy') : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Observed Cycles */}
      {observedCycles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Observed Heat Cycles</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Heat Start Date</th>
                <th className="border border-gray-300 p-2 text-left">Cycle Length</th>
                <th className="border border-gray-300 p-2 text-left">Heat Duration</th>
                <th className="border border-gray-300 p-2 text-left">Breeding?</th>
                <th className="border border-gray-300 p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {observedCycles.map(cycle => (
                <tr key={cycle.id}>
                  <td className="border border-gray-300 p-2">{format(new Date(cycle.cycle_start_date), 'MMM d, yyyy')}</td>
                  <td className="border border-gray-300 p-2">{cycle.cycle_length_days || '-'} days</td>
                  <td className="border border-gray-300 p-2">{cycle.heat_duration_days || '-'} days</td>
                  <td className="border border-gray-300 p-2">{cycle.breeding_occurred ? 'Yes' : 'No'}</td>
                  <td className="border border-gray-300 p-2 text-sm">{cycle.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Predicted Cycles */}
      {predictedCycles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">AI-Generated Predictions</h2>
          <div className="bg-purple-50 p-4 rounded mb-4">
            <p className="text-sm text-gray-700">
              These predictions are generated based on {observedCycles.length} observed heat cycles 
              with an average length of {avgCycleLength} days.
            </p>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-purple-100">
                <th className="border border-gray-300 p-2 text-left">Predicted Heat Date</th>
                <th className="border border-gray-300 p-2 text-left">Expected Cycle Length</th>
                <th className="border border-gray-300 p-2 text-left">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {predictedCycles.map((cycle, idx) => (
                <tr key={cycle.id}>
                  <td className="border border-gray-300 p-2 font-semibold">{format(new Date(cycle.cycle_start_date), 'MMM d, yyyy')}</td>
                  <td className="border border-gray-300 p-2">{cycle.cycle_length_days} days</td>
                  <td className="border border-gray-300 p-2">Prediction #{idx + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Breeding Recommendations */}
      <div className="mb-8 bg-green-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-3">Breeding Recommendations</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>Best breeding window is typically 12-24 hours after standing heat begins</li>
          <li>Consider breeding on days 2 and 3 of heat cycle for optimal conception rates</li>
          <li>Monitor for signs of heat: restlessness, vocalization, tail flagging, mounting behavior</li>
          <li>Average heat duration for this animal: {observedCycles.length > 0 ? observedCycles[0].heat_duration_days : 'N/A'} days</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
        <p>Report generated by Homestead Hub - Estrous Cycle Tracking System</p>
        <p>Animal ID: {animal.id}</p>
      </div>
    </div>
  );
}