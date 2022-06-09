"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// import {sharder} from "../Shaders/shaders.wgsl";
const sharder = `struct Fragment {
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
function GetDevice() {
    return __awaiter(this, void 0, void 0, function* () {
        const adapter = yield navigator.gpu.requestAdapter();
        return yield (adapter === null || adapter === void 0 ? void 0 : adapter.requestDevice());
    });
}
function InitGPU(canvasId) {
    return __awaiter(this, void 0, void 0, function* () {
        const adapter = yield navigator.gpu.requestAdapter();
        if (!adapter)
            return;
        const device = yield adapter.requestDevice();
        const canvasRef = document.getElementById(canvasId);
        const context = canvasRef.getContext('webgpu');
        const format = "bgra8unorm";
        const devicePixelRatio = window.devicePixelRatio || 1;
        const presentationSize = [
            canvasRef.clientWidth * devicePixelRatio,
            canvasRef.clientHeight * devicePixelRatio,
        ];
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device: device,
            format: presentationFormat,
            alphaMode: "premultiplied"
            // size: {width: presentationSize[0], height: presentationSize[1]}
        });
        const pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [] }),
            vertex: {
                module: device.createShaderModule({
                    code: sharder
                }),
                entryPoint: "vs_main"
            },
            fragment: {
                module: device.createShaderModule({
                    code: sharder
                }),
                entryPoint: "fs_main",
                targets: [{
                        format: format
                    }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                    view: textureView,
                    clearValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }]
        });
        renderPass.setPipeline(pipeline);
        // renderPass.setBindGroup(0, bind)
        renderPass.draw(3, 1, 0, 0);
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
    });
}
//# sourceMappingURL=GpuAcess.js.map