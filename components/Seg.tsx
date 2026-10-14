"use client";

/** [카드|리스트] 같은 세그먼트 버튼. 세 번째 값을 주면 이름 옆에 개수를 붙인다 */
export default function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string, number?][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup">
      {options.map(([v, label, count]) => (
        <button key={v} role="radio" aria-checked={v === value} className={v === value ? "on" : ""} onClick={() => onChange(v)}>
          {label}
          {count !== undefined && <span className="count">{count}</span>}
        </button>
      ))}
    </div>
  );
}
