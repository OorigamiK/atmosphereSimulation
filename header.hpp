#pragma once

#include <math.h>
#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include "glad/glad.h"
#include <GLFW/glfw3.h>

// globals.h
#ifndef GLOBALS_H
#define GLOBALS_H

extern bool keys[1024];
extern double mouseX;
extern double mouseY;
extern bool mouseButtons[8];

#endif

struct Vec3 {
    float x, y, z;

    Vec3(float x_=0, float y_=0, float z_=0) : x(x_), y(y_), z(z_) {}

    Vec3 operator+(const Vec3& other) const {
        return Vec3(x + other.x, y + other.y, z + other.z);
    }

    Vec3 operator-(const Vec3& other) const {
        return Vec3(x - other.x, y - other.y, z - other.z);
    }

    Vec3 operator*(float scalar) const {
        return Vec3(x * scalar, y * scalar, z * scalar);
    }

    float dot(const Vec3& other) const {
        return x * other.x + y * other.y + z * other.z;
    }

    // Cross product
    Vec3 cross(const Vec3& other) const {
        return Vec3(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }

    float length() const {
        return sqrt(x * x + y * y + z * z);
    }

    Vec3 normalized() const {
        float len = length();
        if (len == 0) return Vec3(0, 0, 0);
        return (*this) * (1.0f / len);
    }
};

struct Vec2 {
    float x, y;

    Vec2(float x_ = 0, float y_ = 0) : x(x_), y(y_) {}

    Vec2 operator+(const Vec2& other) const {
        return Vec2(x + other.x, y + other.y);
    }

    Vec2 operator-(const Vec2& other) const {
        return Vec2(x - other.x, y - other.y);
    }

    Vec2 operator*(float scalar) const {
        return Vec2(x * scalar, y * scalar);
    }

    float dot(const Vec2& other) const {
        return x * other.x + y * other.y;
    }

    float length() const {
        return sqrt(x * x + y * y);
    }

    Vec2 normalized() const {
        float len = length();
        if (len == 0) return Vec2(0, 0);
        return (*this) * (1.0f / len);
    }
};


void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods);
void mouse_button_callback(GLFWwindow* window, int button, int action, int mods);
void cursor_position_callback(GLFWwindow* window, double xpos, double ypos);
GLuint createShaderProgram(const char* vertexPath, const char* fragmentPath);