export type SchoolLocalOverride = {
  id?: string
  name: string
  totalStudent?: number
  subscriptionPrice?: number
  contract?: string
  contractFileName?: string
}

const STORAGE_KEY = 'sarpongoy_school_overrides'

const canUseStorage = () => typeof window !== 'undefined'

function readOverrides(): SchoolLocalOverride[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SchoolLocalOverride[]) : []
  } catch {
    return []
  }
}

function writeOverrides(overrides: SchoolLocalOverride[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function saveSchoolLocalOverride(override: SchoolLocalOverride) {
  const overrides = readOverrides()
  const index = overrides.findIndex(item =>
    override.id ? item.id === override.id : item.name === override.name,
  )

  const nextOverride = {
    ...(index >= 0 ? overrides[index] : {}),
    ...override,
  }

  if (index >= 0) {
    overrides[index] = nextOverride
  } else {
    overrides.push(nextOverride)
  }

  writeOverrides(overrides)
}

export function removeSchoolLocalOverride(id: string) {
  writeOverrides(readOverrides().filter(item => item.id !== id))
}

export function mergeSchoolLocalOverride<T extends { _id: string; name: string }>(
  school: T,
): T & SchoolLocalOverride {
  const override = readOverrides().find(item => item.id === school._id || item.name === school.name)
  return override ? { ...school, ...override, id: school._id } : school
}
