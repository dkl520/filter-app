# Photo Filter Workbench

Photo Filter Workbench is a lightweight, browser-based image filtering tool built with HTML, CSS, JavaScript, and WebGL. It lets users upload or drag in a photo, preview a large collection of film, cinematic, vintage, pastel, vivid, and experimental visual styles, compare the original and filtered result in real time, and download the processed image.

## Features

- Upload an image from the local device or drag and drop it into the preview area.
- Apply 100 predefined filter presets, each with English and Chinese names.
- Preview filter thumbnails generated from the uploaded image.
- Compare the filtered image with the original using an interactive before-and-after slider.
- Render effects with WebGL shaders for fast, real-time image processing.
- Download the selected filtered result as a PNG image.
- Use the app directly in the browser without a build step or server-side dependency.

## Project Structure

- `index.html`: Main page structure and application layout.
- `style.css`: Visual styling, responsive layout, filter list, controls, and preview area.
- `filters.js`: Filter preset definitions and default rendering parameters.
- `app.js`: WebGL shader engine, image loading, UI events, thumbnail generation, comparison slider, and download logic.

## How to Use

Open `index.html` in a modern browser with WebGL support. Click **Upload Image** or drag a photo into the preview area, then choose a filter from the side lists. Move the comparison slider to inspect the difference between the filtered image and the original. Click **Download Image** to export the current filtered result.

## Technical Overview

The application uses a fragment shader to adjust exposure, contrast, saturation, color temperature, tint, highlights, shadows, fade, grain, vignette, clarity, split toning, RGB shift, glitch, glow, VHS noise, posterization, edge effects, and other visual parameters. Each preset in `filters.js` provides a set of parameter overrides that are merged with the default shader values.

---

# 照片滤镜工作台

照片滤镜工作台是一个轻量级的浏览器端图片滤镜工具，使用 HTML、CSS、JavaScript 和 WebGL 构建。用户可以上传或拖拽一张照片，在浏览器中实时预览多种胶片、电影、复古、粉彩、高饱和和实验风格滤镜，并通过对比滑块查看原图与滤镜效果的差异，最后下载处理后的图片。

## 功能特点

- 支持从本地上传图片，也支持将图片拖拽到预览区域。
- 内置 100 个滤镜预设，每个滤镜都有英文名和中文名。
- 根据用户上传的图片实时生成滤镜缩略图。
- 使用前后对比滑块查看滤镜效果与原图的差异。
- 基于 WebGL 着色器进行实时图像处理，预览响应较快。
- 支持将当前滤镜效果导出为 PNG 图片。
- 项目为纯前端静态应用，不需要构建步骤，也不依赖后端服务。

## 项目结构

- `index.html`：页面结构和应用主体布局。
- `style.css`：界面样式、响应式布局、滤镜列表、操作按钮和预览区域样式。
- `filters.js`：滤镜预设列表和默认渲染参数。
- `app.js`：WebGL 渲染引擎、图片加载、界面交互、缩略图生成、对比滑块和下载逻辑。

## 使用方式

使用支持 WebGL 的现代浏览器打开 `index.html`。点击「上传图片」或将图片拖入预览区域，然后从两侧滤镜列表中选择想要的效果。拖动对比滑块可以查看滤镜效果与原图的区别。点击「下载图片」可以导出当前滤镜处理后的图片。

## 技术说明

应用通过 WebGL 片元着色器处理图片效果，包括曝光、对比度、饱和度、色温、色调、高光、阴影、褪色、颗粒、暗角、清晰度、分离色调、RGB 偏移、故障效果、辉光、VHS 噪声、色阶化和边缘效果等参数。`filters.js` 中的每个滤镜预设都会覆盖一部分默认参数，并与默认着色器参数合并后用于渲染。
