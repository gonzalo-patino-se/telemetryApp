    // src/components/layout/Page.tsx
    import React from 'react';

    type PageProps = {
    title?: string;
    toolbar?: React.ReactNode; // optional right-side actions under title
    children: React.ReactNode;
    };

    const Page: React.FC<PageProps> = ({ title, toolbar, children }) => {
    return (
    <>
        {/* Page header (consistent across pages) */}
        {(title || toolbar) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
            {title ? (
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            ) : <div />}
            {toolbar ?? null}
            </div>
        </div>
        )}

        {/* Page content container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        {children}
        </div>
    </>
    );
    };

    export default Page;