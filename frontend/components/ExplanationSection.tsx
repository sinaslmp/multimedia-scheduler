"use client";

interface MechanismCardProps {
  title: string;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
  accentColor: string;
}

function MechanismCard({
  title,
  tagline,
  description,
  pros,
  cons,
  accentColor,
}: MechanismCardProps) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${accentColor}`}>
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
      <p className="mt-0.5 text-sm font-medium italic text-gray-500">{tagline}</p>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold text-green-700 mb-1">Advantages</p>
          <ul className="space-y-0.5 text-gray-600">
            {pros.map((p) => (
              <li key={p} className="flex gap-1">
                <span className="text-green-500 mt-0.5">+</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-red-700 mb-1">Limitations</p>
          <ul className="space-y-0.5 text-gray-600">
            {cons.map((c) => (
              <li key={c} className="flex gap-1">
                <span className="text-red-400 mt-0.5">-</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ExplanationSection() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Scheduling Mechanisms Explained</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each mechanism represents a different policy for deciding which packet to serve
          next when the link is busy. The choice has measurable effects on delay, fairness,
          and packet loss — especially under congestion.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MechanismCard
          title="FIFO — First In, First Out"
          tagline="Simple. Fair by arrival order. Blind to urgency."
          description={
            "Packets are served in strict arrival order with no differentiation " +
            "between traffic types. This is the simplest possible discipline and " +
            "forms the baseline for comparison. Under light load (ρ < 1) it performs " +
            "well. Under heavy load, urgent multimedia traffic must wait behind " +
            "large background data packets."
          }
          pros={[
            "Simple to implement",
            "No starvation",
            "Predictable order",
            "Fair across flows",
          ]}
          cons={[
            "No QoS differentiation",
            "High delay for real-time traffic",
            "Head-of-line blocking",
          ]}
          accentColor="border-green-400"
        />

        <MechanismCard
          title="Priority Queue"
          tagline="Real-time traffic first. Background traffic waits."
          description={
            "High-priority packets (e.g. VoIP, video) jump ahead of low-priority " +
            "ones (e.g. file transfer). Service is non-preemptive: a packet " +
            "already in service is not interrupted. This dramatically reduces " +
            "latency for high-priority flows under moderate load. The risk is " +
            "starvation of low-priority traffic when the link is heavily loaded."
          }
          pros={[
            "Low delay for high-priority flows",
            "Supports QoS differentiation",
            "Suitable for real-time multimedia",
          ]}
          cons={[
            "Low-priority starvation risk",
            "Less fair overall (lower Jain index)",
            "No benefit if all traffic is high-priority",
          ]}
          accentColor="border-amber-400"
        />

        <MechanismCard
          title="Round Robin"
          tagline="Take turns. No class goes hungry."
          description={
            "The server alternates between a high-priority queue and a " +
            "low-priority queue, serving one packet from each in turn. " +
            "If one queue is empty, the server continues from the other. " +
            "This eliminates starvation and provides more equitable sharing " +
            "of link capacity, at the cost of slightly higher delay for " +
            "high-priority traffic compared to strict Priority."
          }
          pros={[
            "No starvation",
            "Better fairness (higher Jain index)",
            "Predictable service for all classes",
          ]}
          cons={[
            "Higher delay for high-priority vs strict Priority",
            "More complex than FIFO",
            "Less optimal for very time-sensitive flows",
          ]}
          accentColor="border-violet-400"
        />
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Key insight:</strong> All three mechanisms perform similarly under low
        load (ρ = λ/μ &lt; 0.7). Differences become visible as load increases (ρ → 1)
        and become critical under congestion (ρ &gt; 1). Try the <em>Congested Network</em>{" "}
        preset to observe the trade-offs clearly.
      </div>
    </section>
  );
}
