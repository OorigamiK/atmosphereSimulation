gcc -c glad.c -o glad.o
g++ main.cpp shaderSetup.cpp glad.o -I./glad -ldl -lglfw -lGL -o triangle
./triangle
