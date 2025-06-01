#ifndef STB_IMAGE_IMPLEMENTATION
#define STB_IMAGE_IMPLEMENTATION
#endif
#include "stb_image.h"
#include "header.hpp"
#include "input.cpp"

#include "libraries/imgui/imgui.h"
#include "libraries/imgui/imgui_internal.h"
#include "libraries/imgui/imconfig.h"

#include "libraries/imgui/backends/imgui_impl_glfw.h"
#include "libraries/imgui/backends/imgui_impl_opengl3.h"

int main(){
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    GLFWwindow* window = glfwCreateWindow(800, 800, "Atmosphere", nullptr, nullptr);
    if (!window)
    {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);

        // After creating your GLFW window and OpenGL context:
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    ImGui::StyleColorsDark();

    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330 core");


    // Initialize GLAD before calling any OpenGL functions
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "Failed to initialize GLAD\n";
        return -1;
    }


    float vertices[] = {
        -1.0f,  1.0f, 0.0f,  // Top left
        -1.0f,  -1.0f, 0.0f,  // Bottom Left
        1.0f,  -1.0f, 0.0f,   // Bottom Right

        -1.0f,  1.0f, 0.0f,  // Top left
        1.0f,  -1.0f, 0.0f,   // Bottom Right
        1.0f,  1.0f, 0.0f,  // Top right

   };
   
   GLuint VBO, VAO;
   glGenVertexArrays(1, &VAO);
   glGenBuffers(1, &VBO);
   
   // Bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
   glBindVertexArray(VAO);
   
   glBindBuffer(GL_ARRAY_BUFFER, VBO);
   glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
   
   // Position attribute
   glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
   glEnableVertexAttribArray(0);
   
   // Note that this is allowed, the call to glVertexAttribPointer registered VBO as the vertex attribute's bound vertex buffer object so afterwards we can safely unbind
   glBindBuffer(GL_ARRAY_BUFFER, 0); 
   
   // Unbind VAO
   glBindVertexArray(0);

   int width, height, nrChannels;
    unsigned char *data = stbi_load("earth.jpg", &width, &height, &nrChannels, 0);
    if (!data) {
        std::cerr << "Failed to load image!" << std::endl;
    }

    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);

    // Set texture wrapping/filtering options
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    // Upload the texture data
    GLenum format = (nrChannels == 4) ? GL_RGBA : GL_RGB;
    glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
    glGenerateMipmap(GL_TEXTURE_2D);

    // Free the image memory
    stbi_image_free(data);

   GLuint shaderProgram = createShaderProgram("shader.vert", "shader.frag");

   float playerData[10]={0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0};
   GLint dataLocation = glGetUniformLocation(shaderProgram, "playerData");

   glfwSetKeyCallback(window,key_callback);
   glfwSetMouseButtonCallback(window,mouse_button_callback);
   glfwSetCursorPosCallback(window, cursor_position_callback);

    Vec3 pos=Vec3(0,0,0);
    Vec3 vel=Vec3(0,0,0);
    Vec2 rot=Vec2(0,-3.141592653/2);
    float rotVel=-0.01;
    float movVel=1;
    while (!glfwWindowShouldClose(window))
    {
        // Input handling
        glfwPollEvents();
        if (keys[GLFW_KEY_W]){
            vel.x-=sin(rot.x);
            vel.z+=cos(rot.x);
        }
        if (keys[GLFW_KEY_S]){
            vel.x+=sin(rot.x);
            vel.z-=cos(rot.x);
        }
        if (keys[GLFW_KEY_D]){
            vel.x+=cos(rot.x);
            vel.z+=sin(rot.x);
        }
        if (keys[GLFW_KEY_A]){
            vel.x-=cos(rot.x);
            vel.z-=sin(rot.x);
        }
        if (keys[GLFW_KEY_SPACE]){
            vel.y-=1;;
        }
        if (keys[GLFW_KEY_LEFT_SHIFT]){
            vel.y+=1;;
        }
        vel.normalized();
        if (keys[GLFW_KEY_UP]){
            rot.y+=rotVel;
        }
        if (keys[GLFW_KEY_DOWN]){
            rot.y-=rotVel;
        }
        if (keys[GLFW_KEY_RIGHT]){
            rot.x+=rotVel;
        }
        if (keys[GLFW_KEY_LEFT]){
            rot.x-=rotVel;
        }
        pos=pos+vel*movVel;
        vel=vel*0;
        //playerData[0]+=0.001;
        playerData[1]=pos.x;
        playerData[2]=pos.y;
        playerData[3]=pos.z;
        playerData[4]=rot.x;
        playerData[5]=rot.y;

        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();
        
        ImGui::Begin("Example Slider Window");
        ImGui::SliderFloat("time", &playerData[0], 0.0f, 1.0f);
        //ImGui::Text("Value = %.3f", playerData[0]);
        ImGui::End();
        
        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        // Render
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // Draw the triangle
        glUseProgram(shaderProgram);
        glUniform1i(glGetUniformLocation(shaderProgram, "texture1"), 0); // texture unit 0
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);


        glUniform1fv(dataLocation,10, playerData);

        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());


        // Swap buffers and poll IO events
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // Deallocate resources
    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);

    // Terminate GLFW
    glfwTerminate();
}



