import React from "react";
import Icon from "../../assets/iconAsset.js";

function moodIcon (mood){
  if (mood > 70) return Icon.status.mood.happy;
  if (mood > 30) return Icon.status.mood.neutral;
  return Icon.status.mood.sad;
}

export default function Status (props){
  const { energy, hunger, hygiene, mood } = props.value;
  const stats = [
    { label: 'Energy', value: energy, icon: Icon.status.energy, color: '#e0a21b' },
    { label: 'Hunger', value: hunger, icon: Icon.status.hunger, color: '#b8432a' },
    { label: 'Hygiene', value: hygiene, icon: Icon.status.hygiene, color: '#3a7bd5' },
    { label: 'Mood', value: mood, icon: moodIcon(mood), color: '#a24bc4' },
  ];

  return (
    <div id="statusPanel">
      {stats.map(s => (
        <div
          key={s.label}
          className={`stat ${s.value <= 20 ? 'low' : ''}`}
          title={`${s.label}: ${s.value}/100`}
          role="meter"
          aria-label={s.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={s.value}
        >
          <img className="pixel" src={s.icon} alt="" />
          <div className="stat-bar">
            <div
              className="stat-fill"
              style={{ transform: `scaleX(${s.value / 100})`, backgroundColor: s.value <= 20 ? '#d22' : s.color }}
            />
          </div>
          <span className="stat-value">{s.value}</span>
        </div>
      ))}
    </div>
  )
}
