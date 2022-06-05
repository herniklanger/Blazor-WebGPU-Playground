    import sharder from "../Shaders/triangle.vert.wgsl";
// import triangleVertWGSL from '../Shaders/triangle.vert.wgsl';
// import redFragWGSL from '_content/shaders/red.frag.wgsl';
const triangleVertWGSL =
    "@stage(fragment)" +
    "    fn main() -> @location(0) vec4<f32> {" +
    "        return vec4<f32>(1.0, 0.0, 0.0, 1.0);" +
    "}"
const redFragWGSL =
    "@stage(vertex)"+
    "fn main(@builtin(vertex_index) VertexIndex : u32)" +
    "-> @builtin(position) vec4<f32> {" +
    "    var pos = array<vec2<f32>, 3>(" +
    "    vec2<f32>(0.0, 0.5)," +
    "    vec2<f32>(-0.5, -0.5)," +
    "    vec2<f32>(0.5, -0.5));" +
    "return vec4<f32>(pos[VertexIndex], 0.0, 1.0);" +
    "}";


async function GetDevice()
{
    const adapter = await navigator.gpu.requestAdapter();
    return await adapter?.requestDevice();
}

async function InitGPU(canvasId: string)
{
    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) return;
    const device = await adapter.requestDevice();

    const canvasRef : HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(canvasId);
    const context : GPUCanvasContext = <GPUCanvasContext>canvasRef.getContext('webgpu');
    const format : GPUTextureFormat = "bgra8unorm";
    
    
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
        canvasRef.clientWidth * devicePixelRatio,
        canvasRef.clientHeight * devicePixelRatio,
    ];
    const presentationFormat = context.getPreferredFormat(adapter);

    context.configure({
        device: device,
        format: presentationFormat,
        size: presentationSize,
    });

    const pipeline : GPURenderPipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: triangleVertWGSL,
            }),
            entryPoint: 'main',
        },
        fragment: {
            module: device.createShaderModule({
                code: redFragWGSL,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format: presentationFormat,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });
    
    function frame() {

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}
