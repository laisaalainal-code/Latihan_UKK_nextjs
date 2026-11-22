'use client'
 
import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
 
type SiswaFormSiswa = {
    id: number
    nama: string,
    nis: string,
    kelas: string,
    alamat: string,
    createdAt: string,
    updatedAt: string,
}
 
type SiswaFormProps = {
  siswaId?: string
}
 
export function SiswaForm({ siswaId }: SiswaFormProps) {
  const router = useRouter()
  const [siswa, setSiswa] = useState<SiswaFormSiswa| null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(siswaId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [nama, setNama] = useState("")
  const [nis, setNis] = useState("")
  const [kelas, setKelas] = useState("")
  const [alamat, setAlamat] = useState("")
 
  useEffect(() => {
    if (!siswaId) return
 
    let isActive = true
    async function loadSiswa() {
      try {
        const response = await fetch(`/api/siswa/${siswaId}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat siswa.")
 
       const data = result.item ?? result.siswa
        if (isActive && data) {
          setSiswa(data)
          setNama(data.nama ?? "")
          setNis(data.nis ?? "")
          setKelas(data.kelas ?? "")
          setAlamat(data.alamat ?? "")
          
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat siswa.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
 
    void loadSiswa()
    return () => {
      isActive = false
    }
  }, [siswaId])
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(siswaId ? `/api/siswa/${siswaId}` : "/api/siswa", {
        method: siswaId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          nis: nis.trim(),
          kelas: kelas.trim(),
          alamat: alamat.trim(),
         
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menyimpan siswa.")
      router.push("/admin/siswa")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan siswa.")
    } finally {
      setIsSaving(false)
    }
  }
 
  return (
    <Card className="m-6 px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{siswaId ? "Edit siswa" : "Tambah siswa"}</h1>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/siswa")}>
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
      </div>
 
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Memuat siswa...</p>
      ) : siswaId && !siswa ? null : (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-md border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="nama" className="text-sm font-medium">Nama siswa</label>
            <Input id="nama" value={nama} onChange={(event) => setNama(event.target.value)} required maxLength={191} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="nis" className="text-sm font-medium">Nis siswa</label>
            <Input id="nis" value={nis} onChange={(event) => setNis(event.target.value)} required maxLength={191} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="kelas" className="text-sm font-medium">Kelas siswa</label>
            <Input id="kelas" value={kelas} onChange={(event) => setKelas(event.target.value)} required maxLength={191} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="alamat" className="text-sm font-medium">Alamat siswa</label>
            <Input id="alamat" value={alamat} onChange={(event) => setAlamat(event.target.value)} required maxLength={191} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/siswa")} disabled={isSaving}>
              <X aria-hidden="true" />
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : siswa ? "Simpan perubahan" : "Buat siswa"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}