#!/bin/bash

# Compile
g++ main.cpp glad.c shaderSetup.cpp \
libraries/imgui/imgui.cpp \
libraries/imgui/imgui_draw.cpp \
libraries/imgui/imgui_tables.cpp \
libraries/imgui/imgui_widgets.cpp \
libraries/imgui/imgui_demo.cpp \
libraries/imgui/backends/imgui_impl_glfw.cpp \
libraries/imgui/backends/imgui_impl_opengl3.cpp \
-I./glad \
-I./libraries/imgui \
-I./libraries/imgui/backends \
-lglfw -ldl -lGL -lX11 -lpthread -o triangle

# Run
./triangle
