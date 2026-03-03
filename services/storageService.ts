import { Employee, ShiftAssignment, UnitStructure } from '../types';

const EMPLOYEES_KEY = 'sis_escala_employees';
const ASSIGNMENTS_KEY = 'sis_escala_assignments';
const UNITS_KEY = 'sis_escala_units';
const HOURS_KEY = 'sis_escala_hours';
const SHIFT_DEFS_KEY = 'sis_escala_shift_defs';
const GLOSSARY_KEY = 'sis_escala_glossary';
const RULES_TITLE_KEY = 'sis_escala_rules_title';
const RULES_DESC_KEY = 'sis_escala_rules_desc';

import { SHIFT_DEFINITIONS as DEFAULT_SHIFT_DEFINITIONS, LEGEND_GLOSSARY as DEFAULT_LEGEND_GLOSSARY } from '../constants';
import { ShiftDefinition } from '../types';

export const getShiftDefinitions = (): Record<string, ShiftDefinition> => {
    try {
        const data = localStorage.getItem(SHIFT_DEFS_KEY);
        return data ? JSON.parse(data) : DEFAULT_SHIFT_DEFINITIONS;
    } catch (e) {
        return DEFAULT_SHIFT_DEFINITIONS;
    }
};

export const saveShiftDefinitions = (defs: Record<string, ShiftDefinition>): void => {
    localStorage.setItem(SHIFT_DEFS_KEY, JSON.stringify(defs));
    syncToGoogleSheets();
};

export const getGlossary = (): Record<string, string> => {
    try {
        const data = localStorage.getItem(GLOSSARY_KEY);
        return data ? JSON.parse(data) : DEFAULT_LEGEND_GLOSSARY;
    } catch (e) {
        return DEFAULT_LEGEND_GLOSSARY;
    }
};

export const saveGlossary = (glossary: Record<string, string>): void => {
    localStorage.setItem(GLOSSARY_KEY, JSON.stringify(glossary));
    syncToGoogleSheets();
};

export const getRulesTitle = (): string => {
    return localStorage.getItem(RULES_TITLE_KEY) || 'Banco de Conhecimento - Portaria nº 321/2023';
};

export const saveRulesTitle = (title: string): void => {
    localStorage.setItem(RULES_TITLE_KEY, title);
    syncToGoogleSheets();
};

export const getRulesDesc = (): string => {
    return localStorage.getItem(RULES_DESC_KEY) || 'Consulta de legendas e horários oficiais da SES-DF.';
};

export const saveRulesDesc = (desc: string): void => {
    localStorage.setItem(RULES_DESC_KEY, desc);
    syncToGoogleSheets();
};

const DEFAULT_UNITS: UnitStructure[] = [
    { id: '1', name: 'Hospital de Base (HBDF)', sectors: ['UTI Adulto', 'Pronto Socorro', 'Enfermaria A'] },
    { id: '2', name: 'Hospital Materno Infantil (HMIB)', sectors: ['Centro Obstétrico', 'Pediatria', 'Neonatologia'] },
    { id: '3', name: 'UBS 01 Asa Sul', sectors: ['Estratégia Saúde da Família', 'Sala de Vacina'] },
    { id: '4', name: 'UPA Núcleo Bandeirante', sectors: ['Classificação de Risco', 'Box de Emergência'] }
];

const DEFAULT_HOURS = [20, 30, 40];

export const getEmployees = (): Employee[] => {
    try {
        const data = localStorage.getItem(EMPLOYEES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error loading employees", e);
        return [];
    }
};

export const saveEmployee = (employee: Employee): void => {
    const current = getEmployees();
    const existingIndex = current.findIndex(e => e.id === employee.id);
    if (existingIndex >= 0) {
        current[existingIndex] = employee;
    } else {
        current.push(employee);
    }
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(current));
    syncToGoogleSheets();
};

export const deleteEmployee = (id: string): void => {
    const current = getEmployees();
    const updated = current.filter(e => e.id !== id);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
    syncToGoogleSheets();
};

export const getAssignments = (): ShiftAssignment[] => {
    try {
        const data = localStorage.getItem(ASSIGNMENTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error loading assignments", e);
        return [];
    }
};

export const saveAssignments = (assignments: ShiftAssignment[]): void => {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    syncToGoogleSheets();
};

export const getUnits = (): UnitStructure[] => {
    try {
        const data = localStorage.getItem(UNITS_KEY);
        return data ? JSON.parse(data) : DEFAULT_UNITS;
    } catch (e) {
        return DEFAULT_UNITS;
    }
};

export const saveUnits = (units: UnitStructure[]): void => {
    localStorage.setItem(UNITS_KEY, JSON.stringify(units));
    syncToGoogleSheets();
};

export const getContractHoursOptions = (): number[] => {
    try {
        const data = localStorage.getItem(HOURS_KEY);
        return data ? JSON.parse(data) : DEFAULT_HOURS;
    } catch (e) {
        return DEFAULT_HOURS;
    }
};

export const saveContractHoursOptions = (hours: number[]): void => {
    localStorage.setItem(HOURS_KEY, JSON.stringify(hours));
    syncToGoogleSheets();
};

export const clearAllData = () => {
    localStorage.removeItem(EMPLOYEES_KEY);
    localStorage.removeItem(ASSIGNMENTS_KEY);
    localStorage.removeItem(UNITS_KEY);
    localStorage.removeItem(HOURS_KEY);
    syncToGoogleSheets();
};

const GOOGLE_SCRIPT_URL_KEY = 'sis_escala_google_script_url';

export const getGoogleScriptUrl = (): string => {
    return localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || '';
};

export const saveGoogleScriptUrl = (url: string): void => {
    localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url);
};

export const syncToGoogleSheets = async (): Promise<void> => {
    const url = getGoogleScriptUrl();
    if (!url) return;

    try {
        const payload = {
            employees: getEmployees(),
            assignments: getAssignments(),
            settings: [{
                units: getUnits(),
                hours: getContractHoursOptions()
            }],
            rules: [{
                title: getRulesTitle(),
                desc: getRulesDesc(),
                glossary: getGlossary(),
                shiftDefs: getShiftDefinitions()
            }]
        };

        await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveData', payload })
        });
    } catch (e) {
        console.error("Error syncing to Google Sheets", e);
    }
};

export const syncFromGoogleSheets = async (): Promise<boolean> => {
    const url = getGoogleScriptUrl();
    if (!url) return false;

    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            if (result.data.employees && result.data.employees.length > 0) {
                localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(result.data.employees));
            }
            if (result.data.assignments && result.data.assignments.length > 0) {
                localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(result.data.assignments));
            }
            if (result.data.settings && result.data.settings.length > 0) {
                const settings = result.data.settings[0];
                if (settings.units) localStorage.setItem(UNITS_KEY, JSON.stringify(settings.units));
                if (settings.hours) localStorage.setItem(HOURS_KEY, JSON.stringify(settings.hours));
            }
            if (result.data.rules && result.data.rules.length > 0) {
                const rules = result.data.rules[0];
                if (rules.title) localStorage.setItem(RULES_TITLE_KEY, rules.title);
                if (rules.desc) localStorage.setItem(RULES_DESC_KEY, rules.desc);
                if (rules.glossary) localStorage.setItem(GLOSSARY_KEY, JSON.stringify(rules.glossary));
                if (rules.shiftDefs) localStorage.setItem(SHIFT_DEFS_KEY, JSON.stringify(rules.shiftDefs));
            }
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error syncing from Google Sheets", e);
        return false;
    }
};