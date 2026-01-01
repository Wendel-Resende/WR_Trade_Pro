import { db } from "@/lib/db"

const createInnerTRPCContext = () => {
  return {
    db,
  }
}

export const createTRPCContext = async (opts: any) => {
  return createInnerTRPCContext()
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
