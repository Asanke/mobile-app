import CubeCanvas from "@/components/cube-canvas";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center w-screen h-screen bg-background p-4">
      <h1 className="text-4xl font-headline font-bold text-primary mb-4 text-center">
        3D Cabinet Visualizer
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        Click on the doors to open/close them. Drag to rotate, scroll to zoom.
      </p>
      <div className="w-[90vw] h-[70vh] max-w-5xl max-h-[800px] rounded-lg overflow-hidden shadow-2xl border border-border">
        <CubeCanvas />
      </div>
    </main>
  );
}
