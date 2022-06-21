// import {sharder} from "../Shaders/shaders.wgsl";
const sharder =
`struct Fragment {
@builtin(position) Position : vec4<f32>,
@location(0) Color : vec4<f32>
};

@vertex
fn vs_main(@location(0) position : vec2<f32>, @builtin(vertex_index) v_id: u32) -> Fragment {

    //pre-bake positions and colors, for now.
    // var positions = array<vec2<f32>, 3> (
    //     vec2<f32>( 0.0,  0.5),
    //     vec2<f32>(-0.5, -0.5),
    //     vec2<f32>( 0.5, -0.5)
    // );

    var colors = array<vec3<f32>, 3> (
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0)
    );

    var Output : Fragment;
    Output.Position = vec4<f32>(position, 0.0, 1.0);
    Output.Color = vec4<f32>(colors[v_id], 1.0);

    return Output;
}

@fragment
fn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {
    return Color;
}`;

async function GetDevice()
{
    const adapter = await navigator.gpu.requestAdapter();
    return await adapter?.requestDevice();
}

var cubeVertexArray = new Float32Array([
    0.0,  0.5,
    -0.5, -0.5,
    0.5, -0.25
]);

async function InitGPU(canvasId: string, vertexArray :Float32Array)
{
    const vertxtSize = 32;
    if(vertexArray != null){
        cubeVertexArray = new Float32Array(vertexArray) ;
    }
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
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: "opaque"
        // size: {width: presentationSize[0], height: presentationSize[1]}
    });
    const verticesBuffer = device.createBuffer({
        size: vertxtSize,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(vertexArray);
    verticesBuffer.unmap();
    
    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [] }),
        vertex : {
            module : device.createShaderModule({
                code : sharder
            }),
            entryPoint : "vs_main",
            buffers: [
                {
                    arrayStride: 4 * 2,
                    attributes: [
                        {
                            // position
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x2'
                        }
                    ]
                }
            ]
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
            clearValue: {r:0.5, g:0.5, b:0.8, a:1.0},
            loadOp: "clear",
            storeOp: "store"
        }]
    });
    renderPass.setPipeline(pipeline);
    // renderPass.setBindGroup(0, bind)
    renderPass.setVertexBuffer(0, verticesBuffer);
    
    renderPass.draw(3,1,0,0);
    renderPass.end();
    
    device.queue.submit([commandEncoder.finish()]);
    
}
