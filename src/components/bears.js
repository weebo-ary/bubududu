export default function Bears({ small = false }) {
  return (
    <svg
      className={small ? "bears small" : "bears"}
      viewBox="0 0 600 410"
      role="img"
      aria-label="Bubu the panda and Dudu the brown bear holding a heart"
    >
      <ellipse
        cx="305"
        cy="370"
        rx="214"
        ry="18"
        fill="#dec9aa"
        opacity=".26"
      />
      <g
        className="bear-dudu"
        stroke="#654a3d"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <ellipse cx="383" cy="293" rx="86" ry="76" fill="#bd9270" />
        <ellipse cx="331" cy="351" rx="34" ry="20" fill="#bd9270" />
        <ellipse cx="435" cy="350" rx="34" ry="20" fill="#bd9270" />
        <circle cx="318" cy="133" r="30" fill="#bd9270" />
        <circle cx="446" cy="133" r="30" fill="#bd9270" />
        <circle cx="318" cy="133" r="15" fill="#e1b69a" stroke="none" />
        <circle cx="446" cy="133" r="15" fill="#e1b69a" stroke="none" />
        <path
          d="M291 202 Q289 124 382 120 Q478 122 477 207 Q478 265 383 266 Q287 265 291 202"
          fill="#c9a07e"
        />
        <ellipse cx="343" cy="203" rx="5" ry="7" fill="#49392e" stroke="none" />
        <ellipse cx="419" cy="203" rx="5" ry="7" fill="#49392e" stroke="none" />
        <ellipse
          cx="381"
          cy="221"
          rx="25"
          ry="19"
          fill="#ecd1b4"
          stroke="none"
        />
        <path d="M375 215 Q381 211 387 215 L381 222 Z" fill="#49392e" />
        <path
          d="M381 222 Q369 234 365 224 M381 222 Q390 234 397 224"
          fill="none"
          strokeWidth="2.5"
        />
        <ellipse
          cx="322"
          cy="220"
          rx="15"
          ry="8"
          fill="#dc9a90"
          stroke="none"
        />
        <ellipse
          cx="440"
          cy="220"
          rx="15"
          ry="8"
          fill="#dc9a90"
          stroke="none"
        />
        <path d="M422 275 Q454 273 450 301 Q444 325 403 304" fill="#bd9270" />
      </g>
      <g
        className="bear-bubu"
        stroke="#654a3d"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <ellipse cx="211" cy="293" rx="81" ry="73" fill="#fffaf0" />
        <ellipse cx="162" cy="350" rx="32" ry="20" fill="#5e514a" />
        <ellipse cx="263" cy="350" rx="32" ry="20" fill="#5e514a" />
        <circle cx="146" cy="142" r="30" fill="#5e514a" />
        <circle cx="268" cy="142" r="30" fill="#5e514a" />
        <path
          d="M115 209 Q111 134 208 131 Q301 133 301 213 Q300 268 209 270 Q116 269 115 209"
          fill="#fffdf4"
        />
        <ellipse
          cx="170"
          cy="210"
          rx="18"
          ry="24"
          transform="rotate(20 170 210)"
          fill="#5e514a"
          stroke="none"
        />
        <ellipse
          cx="246"
          cy="210"
          rx="18"
          ry="24"
          transform="rotate(-20 246 210)"
          fill="#5e514a"
          stroke="none"
        />
        <circle cx="173" cy="207" r="4" fill="#fff" stroke="none" />
        <circle cx="243" cy="207" r="4" fill="#fff" stroke="none" />
        <path d="M201 225 Q208 220 215 225 L208 232 Z" fill="#5e514a" />
        <path
          d="M208 231 Q199 242 192 232 M208 231 Q216 242 224 232"
          fill="none"
          strokeWidth="2.5"
        />
        <ellipse
          cx="144"
          cy="231"
          rx="16"
          ry="9"
          fill="#f1b2ab"
          stroke="none"
        />
        <ellipse
          cx="271"
          cy="231"
          rx="16"
          ry="9"
          fill="#f1b2ab"
          stroke="none"
        />
        <path d="M174 282 Q139 268 142 296 Q147 319 182 309" fill="#fffaf0" />
      </g>
      <path
        d="M292 316 C240 284 249 255 271 256 Q287 255 292 270 Q305 247 324 259 C349 279 319 302 292 316"
        fill="#de8e93"
        stroke="#a65e65"
        strokeWidth="3"
      />
      <path
        d="M278 273 Q266 265 264 279"
        fill="none"
        stroke="#ffe2db"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g fill="#d99093">
        <path d="M300 91 C272 72 283 56 295 67 C308 49 330 69 300 91" />
        <path d="M489 162 C470 149 478 138 487 145 C498 133 510 147 489 162" />
        <path d="M102 116 C84 102 91 92 100 99 C110 86 124 101 102 116" />
      </g>
      <g stroke="#b99e6a" strokeWidth="2" strokeLinecap="round">
        <path d="M114 292 v16 m-8-8 h16 M470 85 v14 m-7-7 h14 M493 309 v14 m-7-7 h14" />
      </g>
    </svg>
  );
}
