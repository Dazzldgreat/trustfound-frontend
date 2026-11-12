import { createContext, useContext } from "react";

/* The company domain the app is open on (see component/DomainGate). */
export const DomainContext = createContext({
    domain: "",
    slug: "",
    name: "",
    simulated: false,
});

export function useCustomDomain() {
    return useContext(DomainContext);
}
