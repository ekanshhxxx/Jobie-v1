import { Job } from "../types/Job"

const API_URL = "http://localhost:4000/api/jobs"

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(API_URL)
  return res.json()
}