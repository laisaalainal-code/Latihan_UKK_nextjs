import { NextResponse } from "next/server"
import { Prisma } from "@/src/generated/prisma/client"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const siswaFields = {
  id: true,
  kode: true,
  nama: true,
  nis: true,
  kelas: true,
  alamat: true,
  createdAt: true,
  updatedAt: true,
} as const

// =========================================================================
// PEMBUATAN AUTO NUMBER DI BACKEND (API)
// Mencari kode terakhir di database, mengambil angkanya, lalu + 1
// =========================================================================
async function generateKodeSiswa(tx: Prisma.TransactionClient) {
  const prefix = "SIS"

  const lastSiswa = await tx.siswa.findFirst({
    where: {
      kode: { startsWith: prefix },
    },
    orderBy: {
      kode: "desc",
    },
    select: { kode: true },
  })

  if (!lastSiswa || !lastSiswa.kode) {
    return `${prefix}0000001`
  }

  const numericPart = lastSiswa.kode.slice(prefix.length)
  const lastNumber = Number.parseInt(numericPart, 10)
  const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1

  return `${prefix}${String(nextNumber).padStart(7, "0")}`
}

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUser()
  if (!currentUser) {
    return NextResponse.json(
      { error: "Silakan login untuk melanjutkan." },
      { status: 401 }
    )
  }

  const searchParams = new URL(request.url).searchParams
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10)
  const requestedPageSize = Number.parseInt(
    searchParams.get("pageSize") ?? "10",
    10
  )
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(1, requestedPageSize))
    : 10

  try {
    const totalSiswa = await prisma.siswa.count()
    const totalPages = Math.max(1, Math.ceil(totalSiswa / pageSize))
    const page =
      Number.isFinite(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, totalPages)
        : 1

    const siswa = await prisma.siswa.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: siswaFields,
    })

    return NextResponse.json({
      items: siswa,
      pagination: { page, pageSize, totalSiswa, totalPages },
    })
  } catch (error) {
    console.error("Failed to fetch siswa:", error)
    return NextResponse.json(
      { error: "Gagal memuat data siswa." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
 const currentUser = await getAuthenticatedUser()
if (!currentUser) {
  return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
}

  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }


  const nama = typeof body.nama === "string" ? body.nama.trim() : ""
  const nis = typeof body.nis === "string" ? body.nis.trim() : ""
  const kelas = typeof body.kelas === "string" ? body.kelas.trim() : ""
  const alamat = typeof body.alamat === "string" ? body.alamat.trim() : ""
 

  if (!nama) {
    return NextResponse.json(
      { error: "Nama siswa wajib diisi." },
      { status: 400 }
    )
  }
  if (!nis) {
    return NextResponse.json(
      { error: "Nis siswa wajib diisi." },
      { status: 400 }
    )
  }
  if (!kelas) {
    return NextResponse.json(
      { error: "kelas siswa wajib diisi." },
      { status: 400 }
    )
  }
  if (!alamat) {
    return NextResponse.json(
      { error: "alamat siswa wajib diisi." },
      { status: 400 }
    )
  }
 


  try {
    const created = await prisma.$transaction(async (tx) => {
      const kode = await generateKodeSiswa(tx)

      return tx.siswa.create({
        data: {
          kode,
          nama,
          nis,
          alamat,
          kelas,
        },
        select: siswaFields,
      })
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    console.error("Failed to create siswa:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan data siswa." },
      { status: 500 }
    )
  }
}