// import sharder from "./Shaders/triangle.vert.wgsl";
const sharder = 
`struct Fragment {
@builtin(position) Position : vec4<f32>,
@location(0) Color : vec4<f32>
};

@stage(vertex)
fn vs_main(@builtin(vertex_index) v_id: u32) -> Fragment {

    //pre-bake positions and colors, for now.
    var positions = array<vec2<f32>, 3> (
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );

    var colors = array<vec3<f32>, 3> (
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0)
    );

    var Output : Fragment;
    Output.Position = vec4<f32>(positions[v_id], 0.0, 1.0);
    Output.Color = vec4<f32>(colors[v_id], 1.0);

    return Output;
}

@stage(fragment)
fn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {
    return Color;
}`;

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

    const pipeline = device.createRenderPipeline({
        vertex : {
            module : device.createShaderModule({
                code : sharder
            }),
            entryPoint : "vs_main"
        },

        fragment : {
            module : device.createShaderModule({
                code : sharder
            }),
            entryPoint : "fs_main",
            targets : [{
                format : format
            }]
        },

        primitive : {
            topology : "triangle-list"
        }
    });

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{    
            view: textureView,
            clearValue: {r:0.5, g:0.0, b:0.25, a:1.0},
            loadOp: "clear",
            storeOp: "store"
        }]
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(3,1,0,0);
    renderPass.end();
    
    device.queue.submit([commandEncoder.finish()]);
    
}
