import React from "react";

const animalEmojis = {
  chicken: "🐔",
  goat: "🐐",
  sheep: "🐑",
  pig: "🐷",
  cow: "🐄",
  rabbit: "🐰",
  duck: "🦆",
  turkey: "🦃",
  bee_hive: "🐝",
};

function HorseshoeIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3v7a7 7 0 0 0 14 0V3" />
      <path d="M5 3h2M17 3h2" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="16" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="16" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function AnimalIcon({ animal, emojiClass = "text-4xl", svgClass = "w-9 h-9 text-blue-600" }) {
  if (animal?.animal_type === "other" && animal?.animal_type_other) {
    const otherType = animal.animal_type_other.toLowerCase();
    if (otherType.includes("horse") || otherType.includes("equine") || otherType.includes("pony") || otherType.includes("donkey") || otherType.includes("mule")) {
      return <HorseshoeIcon className={svgClass} />;
    }
  }

  const emoji = animalEmojis[animal?.animal_type] || "🐾";
  return <span className={emojiClass}>{emoji}</span>;
}