import type { Metadata } from 'next';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://shopcop-backend.onrender.com/api/v1';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE_URL}/public/vendors/${slug}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      return { title: 'Vendor Not Found | ShopCop' };
    }

    const json = await res.json();
    const profile = json?.data?.profile;
    const businessName = profile?.business_name ?? 'Vendor';
    const description =
      profile?.business_description ??
      `Shop from ${businessName} on ShopCop — a trusted verified vendor.`;
    const image = profile?.profile_photo_url ?? undefined;

    return {
      title: `${businessName} | ShopCop`,
      description,
      openGraph: {
        title: `${businessName} | ShopCop`,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
    };
  } catch {
    return { title: 'ShopCop Vendor' };
  }
}

export default function VendorPublicProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
