import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ============================================================
   PASSWORD INPUT WITH SHOW / HIDE EYE
   Drop-in replacement for <input type="password" />. Accepts
   every normal input prop; className styles the input itself.
============================================================ */

export default function PasswordInput({ className = "", wrapperClassName = "", ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`relative ${wrapperClassName}`}>
            <input
                {...props}
                type={visible ? "text" : "password"}
                className={`${className} pr-12`}
            />

            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-graphite"
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
