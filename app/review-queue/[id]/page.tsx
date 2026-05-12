import DetailClient from '../DetailClient'

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  return <DetailClient itemId={params.id} />
}
